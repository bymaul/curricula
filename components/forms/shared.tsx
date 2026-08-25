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
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { ComponentType, ReactNode } from 'react';
import { useI18n } from '@/components/I18nProvider';
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
        'cursor-grab touch-none text-muted-foreground hover:text-foreground transition-colors p-1.5 -m-0.5',
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
  title: string;
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
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
        'w-full border-dashed gap-2',
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

export function SortableCard({
  id,
  label,
  onRemove,
  removeTitle,
  children,
}: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-4 p-4 border border-border rounded-xl bg-card shadow-sm relative space-y-4"
    >
      <ItemRemoveButton
        onClick={onRemove}
        title={removeTitle}
        className="absolute top-2.5 right-2.5 h-8 w-8"
      />

      <div className="flex items-center gap-2 border-b border-border pb-3 pr-10">
        <DragHandle {...attributes} {...listeners} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>

      {children}
    </div>
  );
}

interface SortableRowProps {
  id: string;
  className?: string;
  handleClassName?: string;
  children: ReactNode;
}

export function SortableRow({
  id,
  className,
  handleClassName,
  children,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'mb-4 p-4 border border-border rounded-xl bg-card shadow-sm relative flex items-end gap-3',
        className,
      )}
    >
      <DragHandle
        {...attributes}
        {...listeners}
        className={cn('mb-2', handleClassName)}
      />
      {children}
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
    let branch: unknown = errors;
    for (const segment of name.split('.')) {
      branch = (branch as Record<string, unknown>)?.[segment];
    }
    branch = (branch as unknown[])?.[index];
    return translateValidationMessage(
      t,
      (branch as Record<string, { message?: string } | undefined>)?.[fieldName]
        ?.message,
    );
  };
  const pathFor = (index: number, fieldName: string) =>
    `${name}.${index}.${fieldName}` as FieldPath<CVData>;

  return (
    <div className="space-y-4 px-4 py-2">
      {showHeading && (
        <SectionHeading title={title} description={description} />
      )}

      <SortableList ids={rows.map((f) => f.id)} onMove={move}>
        {rows.length === 0 && (
          <div className="mb-4 flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center">
            {EmptyIcon && (
              <EmptyIcon
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <p className="max-w-xs text-sm text-muted-foreground">
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

          return variant === 'card' ? (
            <SortableCard
              key={row.id}
              id={row.id}
              label={t('common.itemNumber', {
                label: itemLabel ?? name,
                index: index + 1,
              })}
              onRemove={() => remove(index)}
              removeTitle={removeTitle}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {body}
              </div>
            </SortableCard>
          ) : (
            <SortableRow key={row.id} id={row.id}>
              {body}
              <ItemRemoveButton
                onClick={() => remove(index)}
                title={removeTitle}
              />
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
