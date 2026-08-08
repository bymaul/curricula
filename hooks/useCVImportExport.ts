import { useRef } from 'react';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/components/I18nProvider';
import { extractTextFromPDF, parseCVWithAI } from '@/hooks/useCVImportPDF';
import { getStoredAIAPIKey } from '@/lib/consts';
import { getPDFImportErrorInfo } from '@/lib/pdfImportErrors';
import { RateLimitError, RequestTimeoutError } from '@/lib/request';
import { useImportStore } from '@/store/useImportStore';
import { useUIStore } from '@/store/useUIStore';

export function useCVImportExport() {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const { aiProvider, aiModel } = useUIStore();
  const { t } = useI18n();

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
      title: t('import.importingPdf'),
      description: t('import.extractingText'),
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
        title: t('import.importingPdf'),
        description: images.length
          ? t('import.parsingScanned')
          : t('import.parsingAi'),
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
        title: t('import.pdfParsed'),
        description: warnings.length
          ? warnings.length === 1
            ? t('import.reviewResultIssuesOne', { count: warnings.length })
            : t('import.reviewResultIssuesMany', { count: warnings.length })
          : t('import.reviewResult'),
        timeout: 5000,
      });

      useImportStore.getState().setPendingImport({ data, warnings });
    } catch (error) {
      console.error('PDF import error:', error);

      if (error instanceof RateLimitError) {
        toast.update(loadingToast, {
          type: 'error',
          title: t('import.errors.rateLimitTitle'),
          description: t('import.errors.rateLimitMessage', {
            seconds: error.retryAfterSeconds,
          }),
          priority: 'high',
          timeout: 8000,
          actionProps: {
            children: t('common.retry'),
            onClick: retry,
          },
        });
        return;
      }

      if (error instanceof RequestTimeoutError) {
        toast.update(loadingToast, {
          type: 'error',
          title: t('import.errors.timeoutTitle'),
          description: t('import.errors.timeoutMessage'),
          priority: 'high',
          timeout: 8000,
          actionProps: {
            children: t('common.retry'),
            onClick: retry,
          },
        });
        return;
      }

      const { titleKey, messageKey, rawMessage } = getPDFImportErrorInfo(error);
      toast.update(loadingToast, {
        type: 'error',
        title: t(titleKey),
        description: rawMessage ?? t(messageKey),
        priority: 'high',
        timeout: 8000,
        actionProps: {
          children: t('common.retry'),
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
