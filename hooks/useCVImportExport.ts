import { useRef } from 'react';
import { UseFormReset } from 'react-hook-form';
import { CVData, cvSchema } from '@/lib/schema';
import { toast } from '@/components/ui/toast';
import {
  extractTextFromPDF,
  parseCVTextWithAI,
  ScannedPDFError,
} from '@/hooks/useCVImportPDF';
import { getStoredAIAPIKey } from '@/lib/consts';
import { useUIStore } from '@/store/useUIStore';

interface UseCVImportExportOptions {
  onPDFImported: (data: CVData) => void;
  onMissingAPIKey: () => void;
}

interface PDFImportErrorInfo {
  title: string;
  message: string;
}

function getPDFImportErrorInfo(error: unknown): PDFImportErrorInfo {
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
      message: 'This PDF is password-protected. Remove the password and try again.',
    };
  }

  if (error instanceof TypeError) {
    return {
      title: 'Network error',
      message: 'Could not reach the AI service. Check your connection and try again.',
    };
  }

  return {
    title: 'Import failed',
    message: error instanceof Error ? error.message : 'Could not read the PDF.',
  };
}

export function useCVImportExport(
  cvData: CVData,
  reset: UseFormReset<CVData>,
  options: UseCVImportExportOptions,
) {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { aiProvider, aiModel } = useUIStore();

  const handleExportData = () => {
    const dataStr = JSON.stringify(cvData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cvData.name ? cvData.name.replace(/\s+/g, '_') : 'My'}_CV_Data.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedJson = JSON.parse(event.target?.result as string);
        const validationResult = cvSchema.safeParse(parsedJson);

        if (!validationResult.success) {
          console.error('Validation errors:', validationResult.error);
          toast.add({
            type: 'error',
            description: 'Invalid CV format. The file is corrupted or from an older version.',
            priority: 'high',
          });
          return;
        }

        reset(validationResult.data);

        toast.add({
          type: 'success',
          description: 'CV Data imported successfully!',
        });
      } catch {
        toast.add({
          type: 'error',
          description: 'Could not read file. Please upload a valid JSON backup.',
          priority: 'high',
        });
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleImportPDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const apiKey = getStoredAIAPIKey();

    if (!apiKey) {
      options.onMissingAPIKey();
      return;
    }

    void runPDFImport(file, apiKey);
  };

  const runPDFImport = async (file: File, apiKey: string) => {
    const loadingToast = toast.add({
      type: 'loading',
      title: 'Importing PDF',
      description: 'Extracting text...',
      timeout: 0,
    });

    try {
      const cvText = await extractTextFromPDF(file);

      toast.update(loadingToast, {
        type: 'loading',
        title: 'Importing PDF',
        description: 'Parsing with AI...',
      });

      const parsedCV = await parseCVTextWithAI(cvText, {
        provider: aiProvider,
        modelName: aiModel.trim() || undefined,
        apiKey,
      });

      toast.update(loadingToast, {
        type: 'success',
        title: 'PDF parsed',
        description: 'Review the result before applying.',
        timeout: 5000,
      });

      options.onPDFImported(parsedCV);
    } catch (error) {
      console.error('PDF import error:', error);
      const { title, message } = getPDFImportErrorInfo(error);
      toast.update(loadingToast, {
        type: 'error',
        title,
        description: message,
        priority: 'high',
        timeout: 8000,
      });
    }
  };

  return { jsonInputRef, pdfInputRef, handleExportData, handleImportJSON, handleImportPDF };
}
