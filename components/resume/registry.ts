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

/**
 * Single registry mapping every template id to its render component.
 * The `Record<TemplateId, ...>` type fails to compile when a template id is
 * added without a component (or a component without an id), so the template
 * list in `lib/templates.ts` and this registry can never drift apart.
 */
export const TEMPLATE_COMPONENTS: Record<
  TemplateId,
  ForwardRefExoticComponent<TemplateProps & RefAttributes<HTMLDivElement>>
> = {
  harvard: memo(HarvardTemplate),
  modern: memo(ModernTemplate),
  minimal: memo(MinimalTemplate),
} satisfies Record<TemplateId, ComponentType<TemplateProps>>;
