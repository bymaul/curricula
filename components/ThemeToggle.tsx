'use client';

import { useI18n } from '@/components/I18nProvider';
import { Button } from '@/components/ui/button';
import {
  DROPDOWN_ITEM_CLASS,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeMode, useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';
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
            className="size-9"
            aria-label={t('common.theme')}
          >
            <ActiveIcon className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44 p-1.5">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as ThemeMode)}
        >
          {OPTIONS.map(({ value, icon: Icon, labelKey }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className={cn(DROPDOWN_ITEM_CLASS, 'pr-8')}
            >
              <Icon className="text-muted-foreground shrink-0" />
              {t(labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
