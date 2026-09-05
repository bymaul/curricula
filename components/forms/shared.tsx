'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Award,
  Briefcase,
  FolderGit2,
  GraduationCap,
  GripVertical,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import { ComponentType, ReactNode } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { FormField } from '@/components/ui/form-field';
import { CVData } from '@/lib/schema';
import { translateValidationMessage } from '@/lib/i18n';
import {
  FieldArrayPath,
  FieldPath,
  useFieldArray,
  useFormContext,
} from 'react-hook-form';

export function DragHandle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'text-muted-foreground hover:text-foreground -m-0.5 cursor-grab touch-none p-1.5 transition-colors',
        className,
      )}
    >
      <GripVertical className="size-4" />
    </div>
  );
}

export function ItemRemoveButton({
  onClick,
  title,
  className,
}: {
  onClick: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={title}
      className={cn(
        'text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors',
        className,
      )}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}

export function AddItemButton({
  onClick,
  size = 'default',
  className,
  children,
}: {
  onClick: () => void;
  size?: 'default' | 'sm';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onClick}
      className={cn(
        'w-full gap-2 border-dashed',
        size === 'default' && 'py-5',
        className,
      )}
    >
      <Plus className="size-4" /> {children}
    </Button>
  );
}

interface SortableListProps {
  ids: string[];
  onMove: (fromIndex: number, toIndex: number) => void;
  children: ReactNode;
}

export function SortableList({ ids, onMove, children }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

interface SortableCardProps {
  id: string;
  label: string;
  onRemove: () => void;
  removeTitle: string;
  children: ReactNode;
}

function useSortableStyle(id: string) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  return {
    attributes,
    listeners,
    setNodeRef,
    style: { transform: CSS.Transform.toString(transform), transition },
  };
}

export function SortableCard({
  id,
  label,
  onRemove,
  removeTitle,
  children,
}: SortableCardProps) {
  const { attributes, listeners, setNodeRef, style } = useSortableStyle(id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-border bg-card relative mb-4 space-y-4 rounded-xl border p-4 shadow-sm"
    >
      <ItemRemoveButton
        onClick={onRemove}
        title={removeTitle}
        className="absolute top-2.5 right-2.5 h-8 w-8"
      />

      <div className="border-border flex items-center gap-2 border-b pr-10 pb-3">
        <DragHandle {...attributes} {...listeners} />
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {label}
        </span>
      </div>

      {children}
    </div>
  );
}

interface SortableRowProps {
  id: string;
  label?: string;
  onRemove?: () => void;
  removeTitle?: string;
  className?: string;
  handleClassName?: string;
  children: ReactNode;
}

export function SortableRow({
  id,
  label,
  onRemove,
  removeTitle,
  className,
  handleClassName,
  children,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, style } = useSortableStyle(id);

  const isFormRow = Boolean(onRemove || label);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-border bg-card relative mb-4 rounded-xl border p-3 shadow-sm transition-all',
        isFormRow
          ? 'flex flex-col gap-3 @[400px]/sidebar:flex-row @[400px]/sidebar:items-center'
          : 'flex items-center gap-3',
        className,
      )}
    >
      {isFormRow ? (
        <>
          <div className="border-border flex items-center justify-between border-b pb-2.5 @[400px]/sidebar:contents @[400px]/sidebar:border-b-0 @[400px]/sidebar:pb-0">
            <div className="flex items-center gap-2">
              <DragHandle
                {...attributes}
                {...listeners}
                className={handleClassName}
              />
              {label && (
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase @[400px]/sidebar:hidden">
                  {label}
                </span>
              )}
            </div>
            {onRemove && (
              <ItemRemoveButton
                onClick={onRemove}
                title={removeTitle}
                className="h-8 w-8 @[400px]/sidebar:order-last"
              />
            )}
          </div>

          <div className="grid flex-1 grid-cols-1 gap-3 @[400px]/sidebar:flex @[400px]/sidebar:items-center">
            {children}
          </div>
        </>
      ) : (
        <>
          <DragHandle
            {...attributes}
            {...listeners}
            className={handleClassName}
          />
          {children}
        </>
      )}
    </div>
  );
}

interface SectionFieldDef {
  name: string;
  label: string;
  placeholder?: string;
  className?: string;
  as?: 'input' | 'textarea';
  textareaClassName?: string;
}

type CvListItem =
  | CVData['experience'][number]
  | CVData['projects'][number]
  | CVData['education'][number]
  | CVData['skills'][number]
  | CVData['certifications'][number]
  | CVData['links'][number]
  | NonNullable<CVData['customSections']>[number]['items'][number];

interface SectionFieldArrayProps {
  name: FieldArrayPath<CVData>;
  title: string;
  description: string;
  addLabel: string;
  variant: 'card' | 'row';
  removeTitle: string;
  itemLabel?: string;
  fields: SectionFieldDef[];
  newItem: () => CvListItem;
  emptyIcon?: ComponentType<{ className?: string }>;
  showHeading?: boolean;
}

function getIn(obj: unknown, path: string[]): unknown {
  let branch: unknown = obj;
  for (const segment of path) {
    branch = (branch as Record<string, unknown> | undefined)?.[segment];
    if (branch === undefined) break;
  }
  return branch;
}

export function SectionFieldArray({
  name,
  title,
  description,
  addLabel,
  variant,
  removeTitle,
  itemLabel,
  fields,
  newItem,
  emptyIcon: EmptyIcon,
  showHeading = true,
}: SectionFieldArrayProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CVData>();
  const { t } = useI18n();
  const {
    fields: rows,
    append,
    remove,
    move,
  } = useFieldArray({
    control,
    name: name as FieldArrayPath<CVData>,
  });

  const resolveErrors = (index: number, fieldName: string) => {
    const branch = getIn(errors, name.split('.')) as
      Array<Record<string, { message?: string } | undefined>> | undefined;
    return translateValidationMessage(t, branch?.[index]?.[fieldName]?.message);
  };
  const pathFor = (index: number, fieldName: string) =>
    `${name}.${index}.${fieldName}` as FieldPath<CVData>;

  return (
    <div className={cn('space-y-4 px-4 py-2', !showHeading && 'p-0')}>
      {showHeading && (
        <SectionHeading title={title} description={description} />
      )}

      <SortableList ids={rows.map((f) => f.id)} onMove={move}>
        {rows.length === 0 && (
          <div className="mb-4 flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center">
            {EmptyIcon && (
              <EmptyIcon
                className="text-muted-foreground size-5"
                aria-hidden="true"
              />
            )}
            <p className="text-muted-foreground max-w-xs text-sm">
              {t('common.emptySection', { label: itemLabel ?? name })}
            </p>
          </div>
        )}
        {rows.map((row, index) => {
          const body = fields.map((def) => (
            <FormField
              key={def.name}
              as={def.as}
              className={def.className}
              name={pathFor(index, def.name)}
              label={def.label}
              placeholder={def.placeholder}
              register={register}
              error={resolveErrors(index, def.name)}
              textareaClassName={def.textareaClassName}
            />
          ));

          const currentItemLabel = t('common.itemNumber', {
            label: itemLabel ?? name,
            index: index + 1,
          });

          return variant === 'card' ? (
            <SortableCard
              key={row.id}
              id={row.id}
              label={currentItemLabel}
              onRemove={() => remove(index)}
              removeTitle={removeTitle}
            >
              <div className="grid grid-cols-1 gap-3 @[400px]/sidebar:grid-cols-2">
                {body}
              </div>
            </SortableCard>
          ) : (
            <SortableRow
              key={row.id}
              id={row.id}
              label={currentItemLabel}
              onRemove={() => remove(index)}
              removeTitle={removeTitle}
            >
              {body}
            </SortableRow>
          );
        })}
      </SortableList>

      <AddItemButton onClick={() => append(newItem())}>
        {addLabel}
      </AddItemButton>
    </div>
  );
}

export type BuiltinFormSection =
  'experience' | 'projects' | 'education' | 'skills' | 'certifications';

type TFn = ReturnType<typeof useI18n>['t'];

function getSectionConfig(
  section: BuiltinFormSection,
  t: TFn,
): Omit<SectionFieldArrayProps, 'name'> & {
  name: FieldArrayPath<CVData>;
} {
  switch (section) {
    case 'experience':
      return {
        name: 'experience',
        emptyIcon: Briefcase,
        title: t('workExperience.title'),
        description: t('workExperience.description'),
        addLabel: t('workExperience.add'),
        variant: 'card',
        itemLabel: t('workExperience.itemLabel'),
        removeTitle: t('workExperience.remove'),
        newItem: () => ({
          role: '',
          company: '',
          date: '',
          location: '',
          description: '',
        }),
        fields: [
          {
            name: 'role',
            label: t('workExperience.roleLabel'),
            placeholder: t('workExperience.rolePlaceholder'),
          },
          {
            name: 'company',
            label: t('workExperience.companyLabel'),
            placeholder: t('workExperience.companyPlaceholder'),
          },
          {
            name: 'location',
            label: t('workExperience.locationLabel'),
            placeholder: t('workExperience.locationPlaceholder'),
          },
          {
            name: 'date',
            label: t('workExperience.datesLabel'),
            placeholder: t('workExperience.datesPlaceholder'),
          },
          {
            name: 'description',
            as: 'textarea',
            className: '@[400px]/sidebar:col-span-2',
            label: t('workExperience.descriptionLabel'),
            placeholder: t('workExperience.descriptionPlaceholder'),
          },
        ],
      };
    case 'education':
      return {
        name: 'education',
        emptyIcon: GraduationCap,
        title: t('education.title'),
        description: t('education.description'),
        addLabel: t('education.add'),
        variant: 'card',
        itemLabel: t('education.itemLabel'),
        removeTitle: t('education.remove'),
        newItem: () => ({
          degree: '',
          institution: '',
          date: '',
          location: '',
          description: '',
        }),
        fields: [
          {
            name: 'institution',
            label: t('education.institutionLabel'),
            placeholder: t('education.institutionPlaceholder'),
          },
          {
            name: 'degree',
            label: t('education.degreeLabel'),
            placeholder: t('education.degreePlaceholder'),
          },
          {
            name: 'location',
            label: t('education.locationLabel'),
            placeholder: t('education.locationPlaceholder'),
          },
          {
            name: 'date',
            label: t('education.datesLabel'),
            placeholder: t('education.datesPlaceholder'),
          },
          {
            name: 'description',
            as: 'textarea',
            className: '@[400px]/sidebar:col-span-2',
            label: t('education.summaryLabel'),
            placeholder: t('education.summaryPlaceholder'),
          },
        ],
      };
    case 'projects':
      return {
        name: 'projects',
        emptyIcon: FolderGit2,
        title: t('projects.title'),
        description: t('projects.description'),
        addLabel: t('projects.add'),
        variant: 'card',
        itemLabel: t('projects.itemLabel'),
        removeTitle: t('projects.remove'),
        newItem: () => ({ name: '', date: '', description: '' }),
        fields: [
          {
            name: 'name',
            label: t('projects.nameLabel'),
            placeholder: t('projects.namePlaceholder'),
          },
          {
            name: 'date',
            label: t('projects.datesLabel'),
            placeholder: t('projects.datesPlaceholder'),
          },
          {
            name: 'description',
            as: 'textarea',
            className: '@[400px]/sidebar:col-span-2',
            label: t('projects.descriptionLabel'),
            placeholder: t('projects.descriptionPlaceholder'),
          },
        ],
      };
    case 'skills':
      return {
        name: 'skills',
        emptyIcon: Wrench,
        title: t('skills.title'),
        description: t('skills.description'),
        addLabel: t('skills.addCategory'),
        variant: 'row',
        removeTitle: t('skills.removeCategory'),
        newItem: () => ({ category: '', items: '' }),
        fields: [
          {
            name: 'category',
            label: t('skills.categoryLabel'),
            placeholder: t('skills.categoryPlaceholder'),
          },
          {
            name: 'items',
            label: t('skills.itemsLabel'),
            placeholder: t('skills.itemsPlaceholder'),
          },
        ],
      };
    case 'certifications':
      return {
        name: 'certifications',
        emptyIcon: Award,
        title: t('certifications.title'),
        description: t('certifications.description'),
        addLabel: t('certifications.add'),
        variant: 'row',
        removeTitle: t('certifications.remove'),
        newItem: () => ({ name: '', issuer: '', date: '' }),
        fields: [
          {
            name: 'name',
            label: t('certifications.nameLabel'),
            placeholder: t('certifications.namePlaceholder'),
          },
          {
            name: 'issuer',
            label: t('certifications.issuerLabel'),
            placeholder: t('certifications.issuerPlaceholder'),
          },
          {
            name: 'date',
            label: t('certifications.dateLabel'),
            placeholder: t('certifications.datePlaceholder'),
          },
        ],
      };
  }
}

export function SectionForm({ section }: { section: BuiltinFormSection }) {
  const { t } = useI18n();
  return <SectionFieldArray {...getSectionConfig(section, t)} />;
}
