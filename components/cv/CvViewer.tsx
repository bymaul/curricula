'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATE_COMPONENTS } from '@/components/resume/registry';
import { Button } from '@/components/ui/button';
import { TranslationKey, translate } from '@/lib/i18n';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { getPageDimensions } from '@/lib/pagination';
import { matchShareHash, parseSharePayload, ShareResult } from '@/lib/share';
import { Loader2, Pencil, Printer, TriangleAlert } from 'lucide-react';

type ViewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; result: ShareResult; payload: string };

function useCvViewer(): ViewState {
  const [view, setView] = useState<ViewState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const payload = matchShareHash(window.location.hash);
      if (cancelled) return;
      if (!payload) {
        setView({ status: 'error' });
        return;
      }
      const result = await parseSharePayload(payload);
      if (cancelled) return;
      setView(
        result ? { status: 'ready', result, payload } : { status: 'error' },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return view;
}

export function CvViewer() {
  const view = useCvViewer();
  const router = useRouter();
  const lang: ResumeLanguage =
    view.status === 'ready' ? view.result.language : 'en';
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(lang, key, params),
    [lang],
  );

  useEffect(() => {
    if (view.status !== 'ready') return;
    const name = view.result.data.name?.trim();
    document.title = name
      ? t('cvViewer.documentTitle', { name })
      : t('cvViewer.title');
  }, [view, t]);

  if (view.status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-sm text-muted-foreground print:hidden">
        <Loader2 className="size-4 animate-spin" />
        {t('cvViewer.loading')}
      </div>
    );
  }

  if (view.status === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center print:hidden">
        <TriangleAlert className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('cvViewer.invalid')}</p>
        <Button onClick={() => router.push('/')}>
          {t('cvViewer.invalidAction')}
        </Button>
      </div>
    );
  }

  const { result, payload } = view;
  const { data, photo, template, design } = result;
  const ResumeTemplate = TEMPLATE_COMPONENTS[template];
  const page = getPageDimensions(design?.pageSize);

  return (
    <div className="min-h-dvh bg-muted/10 text-foreground print:min-h-0 print:bg-white">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="truncate text-sm font-semibold">
            {data.name?.trim() || t('template.yourName')}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer />
              {t('cvViewer.print')}
            </Button>
            <Button onClick={() => router.push(`/#resume=${payload}`)}>
              <Pencil />
              {t('cvViewer.edit')}
            </Button>
          </div>
        </div>
      </header>

      <main className="print:p-0">
        <div className="overflow-x-auto py-8 print:overflow-visible print:py-0">
          <div className="mx-auto w-full print:w-full!">
            <div
              className="mx-auto bg-white text-black shadow-2xl print:shadow-none"
              style={{ width: page.width }}
            >
              <ResumeTemplate
                cvData={data}
                language={lang}
                photo={photo}
                design={design}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
