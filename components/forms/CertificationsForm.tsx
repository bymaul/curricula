import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CVData } from '@/lib/schema';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

const SortableCertItem = ({ id, index, remove }: { id: string; index: number; remove: (index: number) => void }) => {
    const {
        register,
        formState: { errors },
    } = useFormContext<CVData>();
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const itemErrors = errors.certifications?.[index];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className='mb-3 p-4 border border-border rounded-xl bg-card shadow-sm relative flex items-end gap-3'>
            <div
                {...attributes}
                {...listeners}
                className='cursor-grab touch-none text-muted-foreground hover:text-foreground p-1 mb-2'>
                <GripVertical className='w-4 h-4' />
            </div>

            <div className='flex-1 space-y-1.5'>
                <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                    Name
                </label>
                <Input
                    {...register(`certifications.${index}.name` as const)}
                    placeholder='AWS Certified Developer'
                    className={itemErrors?.name ? 'border-destructive' : ''}
                />
                {itemErrors?.name && (
                    <p className='text-destructive text-[11px] font-medium'>{itemErrors.name.message}</p>
                )}
            </div>
            <div className='flex-1 space-y-1.5'>
                <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                    Issuer
                </label>
                <Input
                    {...register(`certifications.${index}.issuer` as const)}
                    placeholder='Amazon Web Services'
                    className={itemErrors?.issuer ? 'border-destructive' : ''}
                />
                {itemErrors?.issuer && (
                    <p className='text-destructive text-[11px] font-medium'>{itemErrors.issuer.message}</p>
                )}
            </div>
            <div className='w-1/4 space-y-1.5'>
                <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                    Date
                </label>
                <Input
                    {...register(`certifications.${index}.date` as const)}
                    placeholder='2024'
                    className={itemErrors?.date ? 'border-destructive' : ''}
                />
                {itemErrors?.date && (
                    <p className='text-destructive text-[11px] font-medium'>{itemErrors.date.message}</p>
                )}
            </div>

            <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => remove(index)}
                className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0 mb-0.5 rounded-lg transition-colors'
                title='Remove Certification'>
                <Trash2 className='w-4 h-4' />
            </Button>
        </div>
    );
};

export const CertificationsForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'certifications' });
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((item) => item.id === active.id);
            const newIndex = fields.findIndex((item) => item.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    return (
        <div className='animate-fade-in space-y-4 p-2'>
            <div>
                <h2 className='text-xl font-bold tracking-tight'>Certifications</h2>
                <p className='text-xs text-muted-foreground mt-1'>Add professional credentials and certifications.</p>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field, index) => (
                        <SortableCertItem key={field.id} id={field.id} index={index} remove={remove} />
                    ))}
                </SortableContext>
            </DndContext>

            <Button
                type='button'
                variant='outline'
                onClick={() => append({ name: '', issuer: '', date: '' })}
                className='w-full border-dashed gap-2 py-5'>
                <Plus className='w-4 h-4' /> Add Certification
            </Button>
        </div>
    );
};
