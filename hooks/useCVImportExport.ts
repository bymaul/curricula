import { useRef } from 'react';
import { toast } from '@/components/ui/toast';
import { extractTextFromPDF, parseCVWithAI } from '@/hooks/useCVImportPDF';
import { getStoredAIAPIKey } from '@/lib/consts';
import { getPDFImportErrorInfo } from '@/lib/pdfImportErrors';
import { useImportStore } from '@/store/useImportStore';
import { useUIStore } from '@/store/useUIStore';

export function useCVImportExport() {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const { aiProvider, aiModel } = useUIStore();

  const handleImportPDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    pendingFileRef.current = file;

    const apiKey = getStoredAIAPIKey();

    void runPDFImport(file, apiKey || undefined);
  };

  const runPDFImport = async (file: File, apiKey?: string) => {
    const loadingToast = toast.add({
      type: 'loading',
      title: 'Importing PDF',
      description: 'Extracting text...',
      timeout: 0,
    });

    const retry = () => {
      const fileToRetry = pendingFileRef.current;
      if (fileToRetry) {
        void runPDFImport(fileToRetry, apiKey);
      }
    };

    try {
      const { text, images } = await extractTextFromPDF(file);

      toast.update(loadingToast, {
        type: 'loading',
        title: 'Importing PDF',
        description: images.length
          ? 'Parsing scanned pages with AI...'
          : 'Parsing with AI...',
      });

      const { data, warnings } = await parseCVWithAI(
        { text, images },
        {
          provider: aiProvider,
          modelName: aiModel.trim() || undefined,
          apiKey,
        },
      );

      toast.update(loadingToast, {
        type: 'success',
        title: 'PDF parsed',
        description: warnings.length
          ? `Review the result (${warnings.length} issue${
              warnings.length === 1 ? '' : 's'
            } found).`
          : 'Review the result before applying.',
        timeout: 5000,
      });

      useImportStore.getState().setPendingImport({ data, warnings });
    } catch (error) {
      console.error('PDF import error:', error);
      const { title, message } = getPDFImportErrorInfo(error);
      toast.update(loadingToast, {
        type: 'error',
        title,
        description: message,
        priority: 'high',
        timeout: 8000,
        actionProps: {
          children: 'Retry',
          onClick: retry,
        },
      });
    }
  };

  return {
    pdfInputRef,
    handleImportPDF,
  };
}
