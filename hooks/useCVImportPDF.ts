import { CVData } from '@/lib/schema';
import { AIProvider } from '@/lib/consts';
import { stripInvisibleChars } from '@/lib/cleanText';
import type { CVImagePart } from '@/lib/cvParsing';
import { ScannedPDFError } from '@/lib/pdfImportErrors';
import { parseResponseJSON, RequestTimeoutError } from '@/lib/request';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

const MIN_SCANNED_TEXT_CHARS = 150;
const MAX_SCANNED_PAGES = 5;
const MAX_SCAN_WIDTH = 1200;
const PARSE_TIMEOUT_MS = 55_000;

function getPDFJS() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

async function renderPageToJPEG(
  pdf: PDFDocumentProxy,
  pageNumber: number,
): Promise<CVImagePart | null> {
  const page = await pdf.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2, MAX_SCAN_WIDTH / baseViewport.width);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  await page.render({ canvas, viewport }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  const match = dataUrl.match(/^data:image\/jpeg;base64,(.+)$/);
  return match ? { data: match[1], mimeType: 'image/jpeg' } : null;
}

export interface ExtractedPDFText {
  text: string;
  images: CVImagePart[];
}

/**
 * Extracts text from a PDF client-side. If the text is too sparse (likely a
 * scanned/image PDF), renders the first pages as JPEGs for vision parsing.
 */
export async function extractTextFromPDF(
  file: File,
): Promise<ExtractedPDFText> {
  const pdfjs = await getPDFJS();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;

  try {
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/[ \t]+/g, ' ');
      pages.push(text);
    }
    const text = pages.join('\n');

    const images: CVImagePart[] = [];
    if (text.trim().length < MIN_SCANNED_TEXT_CHARS) {
      const pageCount = Math.min(pdf.numPages, MAX_SCANNED_PAGES);
      for (let i = 1; i <= pageCount; i++) {
        const image = await renderPageToJPEG(pdf, i);
        if (image) images.push(image);
      }
    }

    return { text, images };
  } finally {
    await loadingTask.destroy();
  }
}
interface ParseCVParams {
  provider: AIProvider;
  modelName?: string;
  apiKey?: string;
}

export interface CVParseResponse {
  data: CVData;
  warnings: string[];
}

/** Sends extracted PDF text (and optional page images) to the AI parser. */
export async function parseCVWithAI(
  input: { text: string; images?: CVImagePart[] },
  params: ParseCVParams,
): Promise<CVParseResponse> {
  if (input.text.trim().length === 0 && !input.images?.length) {
    throw new ScannedPDFError();
  }

  const body: Record<string, unknown> = {
    cvText: stripInvisibleChars(input.text),
    ...params,
  };
  if (input.images?.length) {
    body.images = input.images;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS);

  try {
    const response = await fetch('/api/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    return await parseResponseJSON<CVParseResponse>(response);
  } catch (error) {
    if (controller.signal.aborted) throw new RequestTimeoutError();
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
