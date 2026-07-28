import { Button } from '@/components/ui/button';
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
import { FormField } from '../ui/form-field';

const SortableExperienceItem = ({
    id,
    index,
    remove,
}: {
    id: string;
    index: number;
    remove: (index: number) => void;
}) => {
    const {
        register,
        formState: { errors },
    } = useFormContext<CVData>();
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const itemErrors = errors.experience?.[index];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className='mb-4 p-4 border border-border rounded-xl bg-card shadow-sm relative group space-y-4'>
            <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => remove(index)}
                className='absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors'
                title='Remove Experience'>
                <Trash2 className='w-4 h-4' />
            </Button>

            <div className='flex items-center gap-2 border-b border-border pb-3 pr-10'>
                <div
                    {...attributes}
                    {...listeners}
                    className='cursor-grab touch-none text-muted-foreground hover:text-foreground p-1'>
                    <GripVertical className='w-4 h-4' />
                </div>
                <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                    Experience #{index + 1}
                </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <FormField
                    name={`experience.${index}.role` as const}
                    label='Job Title'
                    placeholder='Software Engineer'
                    register={register}
                    error={itemErrors?.role?.message}
                />
                <FormField
                    name={`experience.${index}.company` as const}
                    label='Company'
                    placeholder='Acme Inc.'
                    register={register}
                    error={itemErrors?.company?.message}
                />
                <FormField
                    name={`experience.${index}.location` as const}
                    label='Location'
                    placeholder='Remote / New York'
                    register={register}
                    error={itemErrors?.location?.message}
                />
                <FormField
                    name={`experience.${index}.date` as const}
                    label='Dates'
                    placeholder='Jan 2022 - Present'
                    register={register}
                    error={itemErrors?.date?.message}
                />
            </div>

            <FormField
                as='textarea'
                name={`experience.${index}.description` as const}
                label='Description / Bullet Points'
                placeholder={`- Spearheaded migration to Next.js\n- Improved load speeds by 40%`}
                register={register}
                error={itemErrors?.description?.message}
                textareaClassName='h-32 font-mono text-xs'
            />
        </div>
    );
};

export const ExperienceForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'experience' });
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: any) => {
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
                <h2 className='text-xl font-bold tracking-tight'>Work Experience</h2>
                <p className='text-xs text-muted-foreground mt-1'>
                    Drag items using the handle to reorder your job history.
                </p>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field, index) => (
                        <SortableExperienceItem key={field.id} id={field.id} index={index} remove={remove} />
                    ))}
                </SortableContext>
            </DndContext>
            <Button
                type='button'
                variant='outline'
                onClick={() => append({ role: '', company: '', date: '', location: '', description: '' })}
                className='w-full border-dashed gap-2 py-5'>
                <Plus className='w-4 h-4' /> Add New Experience
            </Button>
        </div>
    );
};
