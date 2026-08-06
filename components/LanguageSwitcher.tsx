'use client';

import { Languages } from 'lucide-react';
import { useI18n } from '@/components/I18nProvider';
import { UI_LANGUAGES } from '@/lib/i18n/languages';
import { useUIStore } from '@/store/useUIStore';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function LanguageSwitcher() {
  const { lang } = useI18n();
  const setUILanguage = useUIStore((state) => state.setUILanguage);
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-9 w-9"
            aria-label={t('common.language')}
          >
            <Languages className="w-4 h-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44 p-1.5">
        {UI_LANGUAGES.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setUILanguage(option.value)}
            className="gap-2 py-2 px-3 text-sm cursor-pointer rounded-md"
          >
            <span className="flex-1">{option.label}</span>
            {option.value === lang && <span aria-hidden>✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
