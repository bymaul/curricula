import { describe, expect, it } from 'vitest';
import { ScannedPDFError, getPDFImportErrorInfo } from '@/lib/pdfImportErrors';

describe('getPDFImportErrorInfo', () => {
  it('describes scanned PDFs', () => {
    const info = getPDFImportErrorInfo(new ScannedPDFError());
    expect(info).toEqual({
      titleKey: 'import.errors.scannedTitle',
      messageKey: 'import.errors.scannedMessage',
    });
  });

  it('describes password-protected PDFs by error name', () => {
    const error = new Error('bad');
    error.name = 'PasswordException';
    const info = getPDFImportErrorInfo(error);
    expect(info).toEqual({
      titleKey: 'import.errors.passwordTitle',
      messageKey: 'import.errors.passwordMessage',
    });
  });

  it('describes network errors', () => {
    const info = getPDFImportErrorInfo(new TypeError('failed'));
    expect(info).toEqual({
      titleKey: 'import.errors.networkTitle',
      messageKey: 'import.errors.networkMessage',
    });
  });

  it('falls back with the raw error message', () => {
    const info = getPDFImportErrorInfo(new Error('boom'));
    expect(info).toEqual({
      titleKey: 'import.errors.failedTitle',
      messageKey: 'import.errors.readFailed',
      rawMessage: 'boom',
    });
  });

  it('falls back for non-Error values', () => {
    expect(getPDFImportErrorInfo('nope')).toEqual({
      titleKey: 'import.errors.failedTitle',
      messageKey: 'import.errors.readFailed',
    });
  });
});
