export class ScannedPDFError extends Error {
  constructor() {
    super(
      'This PDF appears to be scanned images with no extractable text. Use a text-based PDF or run OCR first.',
    );
    this.name = 'ScannedPDFError';
  }
}

export interface PDFImportErrorInfo {
  title: string;
  message: string;
}

export function getPDFImportErrorInfo(error: unknown): PDFImportErrorInfo {
  if (error instanceof ScannedPDFError) {
    return {
      title: 'No text found',
      message: error.message,
    };
  }

  const name = error instanceof Error ? error.name : '';

  if (name === 'PasswordException') {
    return {
      title: 'Password protected',
      message:
        'This PDF is password-protected. Remove the password and try again.',
    };
  }

  if (error instanceof TypeError) {
    return {
      title: 'Network error',
      message:
        'Could not reach the AI service. Check your connection and try again.',
    };
  }

  return {
    title: 'Import failed',
    message: error instanceof Error ? error.message : 'Could not read the PDF.',
  };
}
