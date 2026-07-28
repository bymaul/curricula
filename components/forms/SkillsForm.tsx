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

const SortableSkillItem = ({ id, index, remove }: { id: string; index: number; remove: (index: number) => void }) => {
    const {
        register,
        formState: { errors },
    } = useFormContext<CVData>();
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const itemErrors = errors.skills?.[index];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className='mb-3 p-3.5 border border-border rounded-xl bg-card shadow-sm relative flex items-end gap-3'>
            <div
                {...attributes}
                {...listeners}
                className='cursor-grab touch-none text-muted-foreground hover:text-foreground p-1 mb-2'>
                <GripVertical />
            </div>

            <FormField
                className='w-1/3'
                name={`skills.${index}.category` as const}
                label='Category'
                placeholder='Languages'
                register={register}
                error={itemErrors?.category?.message}
            />

            <FormField
                className='flex-1'
                name={`skills.${index}.items` as const}
                label='Skills'
                placeholder='TypeScript, Python, SQL...'
                register={register}
                error={itemErrors?.items?.message}
            />

            <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => remove(index)}
                className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'
                title='Remove Skill Category'>
                <Trash2 />
            </Button>
        </div>
    );
};

export const SkillsForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'skills' });
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
                <h2 className='text-xl font-bold tracking-tight'>Skills</h2>
                <p className='text-xs text-muted-foreground mt-1'>
                    Group your technical and soft skills by category for ATS readability.
                </p>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field, index) => (
                        <SortableSkillItem key={field.id} id={field.id} index={index} remove={remove} />
                    ))}
                </SortableContext>
            </DndContext>

            <Button
                type='button'
                variant='outline'
                onClick={() => append({ category: '', items: '' })}
                className='w-full border-dashed gap-2 py-5'>
                <Plus /> Add Skill Category
            </Button>
        </div>
    );
};
