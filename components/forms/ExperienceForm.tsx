import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
                    className='cursor-grab text-muted-foreground hover:text-foreground p-1'>
                    <GripVertical className='w-4 h-4' />
                </div>
                <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
                    Experience #{index + 1}
                </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                        Job Title
                    </label>
                    <Input
                        {...register(`experience.${index}.role` as const)}
                        placeholder='Software Engineer'
                        className={itemErrors?.role ? 'border-destructive' : ''}
                    />
                    {itemErrors?.role && (
                        <p className='text-destructive text-[11px] font-medium'>{itemErrors.role.message}</p>
                    )}
                </div>
                <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                        Company
                    </label>
                    <Input
                        {...register(`experience.${index}.company` as const)}
                        placeholder='Acme Inc.'
                        className={itemErrors?.company ? 'border-destructive' : ''}
                    />
                    {itemErrors?.company && (
                        <p className='text-destructive text-[11px] font-medium'>{itemErrors.company.message}</p>
                    )}
                </div>
                <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                        Location
                    </label>
                    <Input {...register(`experience.${index}.location` as const)} placeholder='Remote / New York' />
                </div>
                <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                        Dates
                    </label>
                    <Input
                        {...register(`experience.${index}.date` as const)}
                        placeholder='Jan 2022 - Present'
                        className={itemErrors?.date ? 'border-destructive' : ''}
                    />
                    {itemErrors?.date && (
                        <p className='text-destructive text-[11px] font-medium'>{itemErrors.date.message}</p>
                    )}
                </div>
            </div>

            <div className='space-y-1.5'>
                <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                    Description / Bullet Points
                </label>
                <Textarea
                    {...register(`experience.${index}.description` as const)}
                    placeholder='- Spearheaded migration to Next.js&#10;- Improved load speeds by 40%'
                    className='h-32 font-mono text-xs'
                />
            </div>
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
        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((item) => item.id === active.id);
            const newIndex = fields.findIndex((item) => item.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    return (
        <div className='animate-fade-in space-y-4'>
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
