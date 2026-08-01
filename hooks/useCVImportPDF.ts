import { CVData } from '@/lib/schema';
import { AIProvider } from '@/lib/consts';
import { parseResponseJSON } from '@/lib/request';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

function getPDFJS() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/** Extracts raw text from a PDF file entirely client-side. */
export async function extractTextFromPDF(file: File): Promise<string> {
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
    return pages.join('\n');
  } finally {
    await loadingTask.destroy();
  }
}

export class ScannedPDFError extends Error {
  constructor() {
    super('This PDF appears to be scanned images with no extractable text. Use a text-based PDF or run OCR first.');
    this.name = 'ScannedPDFError';
  }
}

interface ParseCVParams {
  provider: AIProvider;
  modelName?: string;
  apiKey: string;
}

/** Sends extracted PDF text to the AI and returns structured CVData. */
export async function parseCVTextWithAI(cvText: string, params: ParseCVParams): Promise<CVData> {
  if (cvText.trim().length < 40) {
    throw new ScannedPDFError();
  }

  const response = await fetch('/api/parse-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cvText, ...params }),
  });

  return parseResponseJSON<CVData>(response);
}
