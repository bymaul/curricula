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
import { ReactNode } from 'react';

export function DragHandle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'cursor-grab touch-none text-muted-foreground hover:text-foreground p-1',
        className,
      )}
    >
      <GripVertical className="w-4 h-4" />
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
      <Trash2 className="w-4 h-4" />
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
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
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
      <Plus className="w-4 h-4" /> {children}
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
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-4 p-4 border border-border rounded-xl bg-card shadow-sm relative group space-y-4"
    >
      <ItemRemoveButton
        onClick={onRemove}
        title={removeTitle}
        className="absolute top-3 right-3 h-7 w-7"
      />

      <div className="flex items-center gap-2 border-b border-border pb-3 pr-10">
        <DragHandle {...attributes} {...listeners} />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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

export function SortableRow({ id, className, handleClassName, children }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'mb-3 p-3.5 border border-border rounded-xl bg-card shadow-sm relative flex items-end gap-3',
        className,
      )}
    >
      <DragHandle {...attributes} {...listeners} className={cn('mb-2', handleClassName)} />
      {children}
    </div>
  );
}
