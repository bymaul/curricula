'use client';

import { useI18n } from '@/components/I18nProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeMode, useUIStore } from '@/store/useUIStore';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';

const OPTIONS: {
  value: ThemeMode;
  icon: typeof Sun;
  labelKey: 'header.themeSystem' | 'header.themeLight' | 'header.themeDark';
}[] = [
  { value: 'system', icon: Monitor, labelKey: 'header.themeSystem' },
  { value: 'light', icon: Sun, labelKey: 'header.themeLight' },
  { value: 'dark', icon: Moon, labelKey: 'header.themeDark' },
];

export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

/** Applies the resolved theme to <html> and tracks OS changes in system mode. */
export function applyThemeClass(theme: ThemeMode) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia(DARK_MEDIA_QUERY).matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const { t } = useI18n();

  useEffect(() => {
    applyThemeClass(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia(DARK_MEDIA_QUERY);
    const onChange = () => applyThemeClass('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const active = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[0];
  const ActiveIcon = active.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-9 w-9"
            aria-label={t('common.theme')}
          >
            <ActiveIcon className="w-4 h-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44 p-1.5">
        {OPTIONS.map(({ value, icon: Icon, labelKey }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="gap-2 py-2 px-3 text-sm cursor-pointer rounded-md"
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{t(labelKey)}</span>
            {value === theme && <span aria-hidden>✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
