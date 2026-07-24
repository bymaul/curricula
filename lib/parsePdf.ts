export async function extractTextFromPDF(file: File): Promise<string> {
    // 1. Dynamically import pdfjs-dist ONLY on the client to avoid SSR DOMMatrix errors
    const pdfjsLib = await import('pdfjs-dist');

    // 2. Use unpkg and explicitly request the .mjs worker file for modern versions
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();

    // 3. Initialize the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    // 4. Iterate through all pages and extract the text strings
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}
