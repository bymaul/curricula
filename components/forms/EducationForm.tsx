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

const SortableEducationItem = ({
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

    const itemErrors = errors.education?.[index];

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
                title='Remove Education'>
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
                    Education #{index + 1}
                </span>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                        Institution
                    </label>
                    <Input
                        {...register(`education.${index}.institution` as const)}
                        placeholder='University of California'
                        className={itemErrors?.institution ? 'border-destructive' : ''}
                    />
                    {itemErrors?.institution && (
                        <p className='text-destructive text-[11px] font-medium'>{itemErrors.institution.message}</p>
                    )}
                </div>
                <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                        Degree / Major
                    </label>
                    <Input
                        {...register(`education.${index}.degree` as const)}
                        placeholder='B.S. in Computer Science'
                        className={itemErrors?.degree ? 'border-destructive' : ''}
                    />
                    {itemErrors?.degree && (
                        <p className='text-destructive text-[11px] font-medium'>{itemErrors.degree.message}</p>
                    )}
                </div>
                <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                        Location
                    </label>
                    <Input {...register(`education.${index}.location` as const)} placeholder='Berkeley, CA' />
                </div>
                <div className='space-y-1.5'>
                    <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                        Dates
                    </label>
                    <Input
                        {...register(`education.${index}.date` as const)}
                        placeholder='2018 - 2022'
                        className={itemErrors?.date ? 'border-destructive' : ''}
                    />
                    {itemErrors?.date && (
                        <p className='text-destructive text-[11px] font-medium'>{itemErrors.date.message}</p>
                    )}
                </div>
                <div className='sm:col-span-2 space-y-1.5'>
                    <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
                        Summary / Highlights
                    </label>
                    <Textarea
                        {...register(`education.${index}.description` as const)}
                        placeholder='GPA: 3.8 / Dean’s List / Relevant Coursework...'
                        className='h-24'
                    />
                </div>
            </div>
        </div>
    );
};

export const EducationForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'education' });
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
                <h2 className='text-xl font-bold tracking-tight'>Education</h2>
                <p className='text-xs text-muted-foreground mt-1'>Add your academic background and credentials.</p>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field, index) => (
                        <SortableEducationItem key={field.id} id={field.id} index={index} remove={remove} />
                    ))}
                </SortableContext>
            </DndContext>

            <Button
                type='button'
                variant='outline'
                onClick={() => append({ institution: '', degree: '', date: '', location: '', description: '' })}
                className='w-full border-dashed gap-2 py-5'>
                <Plus className='w-4 h-4' /> Add Education
            </Button>
        </div>
    );
};
