import { CVData } from '@/lib/schema';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
    const { register } = useFormContext<CVData>();
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className='mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm relative group'>
            <div
                {...attributes}
                {...listeners}
                className='absolute left-2 top-4 cursor-grab text-gray-400 hover:text-black'>
                ⣿
            </div>
            <button
                type='button'
                onClick={() => remove(index)}
                className='absolute top-4 right-4 text-red-500 text-xs font-bold hover:underline'>
                Remove
            </button>

            <div className='pl-6 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3'>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Institution</label>
                    <input
                        {...register(`education.${index}.institution` as const)}
                        className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Degree / Major</label>
                    <input
                        {...register(`education.${index}.degree` as const)}
                        className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Location</label>
                    <input
                        {...register(`education.${index}.location` as const)}
                        className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Dates</label>
                    <input
                        {...register(`education.${index}.date` as const)}
                        className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                    />
                </div>
                <div className='sm:col-span-2'>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Summary / Highlights</label>
                    <textarea
                        {...register(`education.${index}.description` as const)}
                        placeholder='Extracurriculars, GPA, or thesis details...'
                        className='w-full border p-2 rounded text-sm h-24 bg-gray-50 focus:bg-white resize-y mt-1'
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
        if (active.id !== over.id) {
            const oldIndex = fields.findIndex((item) => item.id === active.id);
            const newIndex = fields.findIndex((item) => item.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    return (
        <div className='animate-fade-in'>
            <h2 className='text-2xl font-bold mb-1'>Education</h2>
            <p className='text-sm text-gray-500 mb-6'>Drag the handles (⣿) to reorder your education.</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field, index) => (
                        <SortableEducationItem key={field.id} id={field.id} index={index} remove={remove} />
                    ))}
                </SortableContext>
            </DndContext>

            <button
                type='button'
                onClick={() => append({ institution: '', degree: '', date: '', location: '', description: '' })}
                className='w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition'>
                + Add Education
            </button>
        </div>
    );
};
