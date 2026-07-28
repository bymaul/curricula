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

const SortableProjectItem = ({ id, index, remove }: { id: string; index: number; remove: (index: number) => void }) => {
    const {
        register,
        formState: { errors },
    } = useFormContext<CVData>();
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const itemErrors = errors.projects?.[index];

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
                title='Remove Project'>
                <Trash2 />
            </Button>

            <div className='flex items-center gap-2 border-b border-border pb-3 pr-10'>
                <div
                    {...attributes}
                    {...listeners}
                    className='cursor-grab touch-none text-muted-foreground hover:text-foreground p-1'>
                    <GripVertical />
                </div>
                <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                    Project #{index + 1}
                </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <FormField
                    name={`projects.${index}.name` as const}
                    label='Project Name'
                    placeholder='E-Commerce SaaS Platform'
                    register={register}
                    error={itemErrors?.name?.message}
                />
                <FormField
                    name={`projects.${index}.date` as const}
                    label='Dates'
                    placeholder='2023 - Present'
                    register={register}
                    error={itemErrors?.date?.message}
                />
            </div>

            <FormField
                as='textarea'
                name={`projects.${index}.description` as const}
                label='Description / Bullet Points'
                placeholder='- Built with Next.js, Tailwind, and PostgreSQL...'
                register={register}
                error={itemErrors?.description?.message}
                textareaClassName='h-32 font-mono text-xs'
            />
        </div>
    );
};

export const ProjectsForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'projects' });
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
        <div className='animate-fade-in space-y-4 p-2'>
            <div>
                <h2 className='text-xl font-bold tracking-tight'>Projects</h2>
                <p className='text-xs text-muted-foreground mt-1'>Highlight side projects or open-source work.</p>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field, index) => (
                        <SortableProjectItem key={field.id} id={field.id} index={index} remove={remove} />
                    ))}
                </SortableContext>
            </DndContext>

            <Button
                type='button'
                variant='outline'
                onClick={() => append({ name: '', date: '', description: '' })}
                className='w-full border-dashed gap-2 py-5'>
                <Plus /> Add New Project
            </Button>
        </div>
    );
};
