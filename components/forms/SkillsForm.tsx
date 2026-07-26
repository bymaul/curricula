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
                className='cursor-grab text-muted-foreground hover:text-foreground p-1 mb-2'>
                <GripVertical className='w-4 h-4' />
            </div>

            <div className='w-1/3 space-y-1.5'>
                <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                    Category
                </label>
                <Input
                    {...register(`skills.${index}.category` as const)}
                    placeholder='Languages'
                    className={itemErrors?.category ? 'border-destructive' : ''}
                />
                {itemErrors?.category && (
                    <p className='text-destructive text-[11px] font-medium'>{itemErrors.category.message}</p>
                )}
            </div>
            <div className='flex-1 space-y-1.5'>
                <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                    Skills
                </label>
                <Input
                    {...register(`skills.${index}.items` as const)}
                    placeholder='TypeScript, Python, SQL...'
                    className={itemErrors?.items ? 'border-destructive' : ''}
                />
                {itemErrors?.items && (
                    <p className='text-destructive text-[11px] font-medium'>{itemErrors.items.message}</p>
                )}
            </div>

            <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => remove(index)}
                className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0 mb-0.5 rounded-lg transition-colors'
                title='Remove Skill Category'>
                <Trash2 className='w-4 h-4' />
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
                <Plus className='w-4 h-4' /> Add Skill Category
            </Button>
        </div>
    );
};
