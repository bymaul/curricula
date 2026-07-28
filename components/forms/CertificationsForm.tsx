import { Button } from '@/components/ui/button';
import { CVData } from '@/lib/schema';
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
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';

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

            <FormField
                className='flex-1'
                name={`certifications.${index}.name` as const}
                label='Name'
                placeholder='AWS Certified Developer'
                register={register}
                error={itemErrors?.name?.message}
            />
            <FormField
                className='flex-1'
                name={`certifications.${index}.issuer` as const}
                label='Issuer'
                placeholder='Amazon Web Services'
                register={register}
                error={itemErrors?.issuer?.message}
            />
            <FormField
                className='w-1/4'
                name={`certifications.${index}.date` as const}
                label='Date'
                placeholder='2024'
                register={register}
                error={itemErrors?.date?.message}
            />

            <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => remove(index)}
                className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id)
            move(
                fields.findIndex((i) => i.id === active.id),
                fields.findIndex((i) => i.id === over.id),
            );
    };

    return (
        <div className='space-y-4 p-2'>
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
