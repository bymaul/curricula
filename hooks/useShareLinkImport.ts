'use client';

import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/components/I18nProvider';
import { parseSharePayload } from '@/lib/share';
import { useResumeStore } from '@/store/useResumeStore';

export function useShareLinkImport() {
  const { t } = useI18n();
  useEffect(() => {
    const match = window.location.hash.match(/^#resume=([A-Za-z0-9_-]+)$/);
    if (!match) return;
    let cancelled = false;
    void parseSharePayload(match[1]).then((data) => {
      if (cancelled || !data) return;
      const name = data.name?.trim();
      useResumeStore.getState().importResumeData(data, name);
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
