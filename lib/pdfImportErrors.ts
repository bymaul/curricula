import { TranslationKey } from '@/lib/i18n';

export class ScannedPDFError extends Error {
  constructor() {
    super('ScannedPDFError');
    this.name = 'ScannedPDFError';
  }
}

export interface PDFImportErrorInfo {
  titleKey: TranslationKey;
  messageKey: TranslationKey;
  rawMessage?: string;
}

export function getPDFImportErrorInfo(error: unknown): PDFImportErrorInfo {
  if (error instanceof ScannedPDFError) {
    return {
      titleKey: 'import.errors.scannedTitle',
      messageKey: 'import.errors.scannedMessage',
    };
  }

  const name = error instanceof Error ? error.name : '';

  if (name === 'PasswordException') {
    return {
      titleKey: 'import.errors.passwordTitle',
      messageKey: 'import.errors.passwordMessage',
    };
  }

  if (error instanceof TypeError) {
    return {
      titleKey: 'import.errors.networkTitle',
      messageKey: 'import.errors.networkMessage',
    };
  }

  return {
    titleKey: 'import.errors.failedTitle',
    messageKey: 'import.errors.readFailed',
    rawMessage: error instanceof Error ? error.message : undefined,
  };
}
