'use client';

import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/components/I18nProvider';
import { matchShareHash, parseSharePayload } from '@/lib/share';
import { useResumeStore } from '@/store/useResumeStore';

export function useShareLinkImport() {
  const { t } = useI18n();
  useEffect(() => {
    const payload = matchShareHash(window.location.hash);
    if (!payload) return;
    let cancelled = false;
    void parseSharePayload(payload).then((result) => {
      if (cancelled) return;
      if (!result) {
        toast.add({ type: 'error', description: t('share.invalid') });
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search,
        );
        return;
      }
      const name = result.data.name?.trim();
      useResumeStore.getState().importResumeData(result.data, name, {
        language: result.language,
        photo: result.photo,
        template: result.template,
        design: result.design,
      });
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      );
      toast.add({
        type: 'success',
        description: name
          ? t('share.openedWithName', { name })
          : t('share.opened'),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [t]);
}
