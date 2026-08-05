import { describe, expect, it } from 'vitest';
import { ScannedPDFError, getPDFImportErrorInfo } from '@/lib/pdfImportErrors';

describe('getPDFImportErrorInfo', () => {
  it('describes scanned PDFs', () => {
    const info = getPDFImportErrorInfo(new ScannedPDFError());
    expect(info.title).toBe('No text found');
    expect(info.message).toContain('scanned images');
  });

  it('describes password-protected PDFs by error name', () => {
    const error = new Error('bad');
    error.name = 'PasswordException';
    const info = getPDFImportErrorInfo(error);
    expect(info.title).toBe('Password protected');
  });

  it('describes network errors', () => {
    const info = getPDFImportErrorInfo(new TypeError('failed'));
    expect(info.title).toBe('Network error');
  });

  it('falls back to the error message', () => {
    const info = getPDFImportErrorInfo(new Error('boom'));
    expect(info).toEqual({ title: 'Import failed', message: 'boom' });
  });

  it('falls back for non-Error values', () => {
    expect(getPDFImportErrorInfo('nope')).toEqual({
      title: 'Import failed',
      message: 'Could not read the PDF.',
    });
  });
});
