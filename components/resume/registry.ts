import { memo } from 'react';
import type {
  ComponentType,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';
import type { TemplateId } from '@/lib/templates';
import { HarvardTemplate } from './HarvardTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { ModernTemplate } from './ModernTemplate';
import type { TemplateProps } from './shared';

export const TEMPLATE_COMPONENTS: Record<
  TemplateId,
  ForwardRefExoticComponent<TemplateProps & RefAttributes<HTMLDivElement>>
> = {
  harvard: memo(HarvardTemplate),
  modern: memo(ModernTemplate),
  minimal: memo(MinimalTemplate),
} satisfies Record<TemplateId, ComponentType<TemplateProps>>;
