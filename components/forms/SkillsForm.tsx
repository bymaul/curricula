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

const SortableSkillItem = ({ id, index, remove }: { id: string; index: number; remove: (index: number) => void }) => {
    const { register } = useFormContext<CVData>();
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className='mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm relative flex items-center gap-4'>
            <div {...attributes} {...listeners} className='cursor-grab text-gray-400 hover:text-black'>
                ⣿
            </div>

            <div className='w-1/3'>
                <label className='text-xs font-bold text-gray-500 uppercase'>Category</label>
                <input
                    {...register(`skills.${index}.category` as const)}
                    placeholder='e.g., Languages'
                    className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                />
            </div>
            <div className='flex-1'>
                <label className='text-xs font-bold text-gray-500 uppercase'>Skills</label>
                <input
                    {...register(`skills.${index}.items` as const)}
                    placeholder='React, TypeScript, Next.js...'
                    className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                />
            </div>

            <button
                type='button'
                onClick={() => remove(index)}
                className='text-gray-400 hover:text-red-500 font-bold mt-4'>
                ✕
            </button>
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
        if (active.id !== over.id) {
            const oldIndex = fields.findIndex((item) => item.id === active.id);
            const newIndex = fields.findIndex((item) => item.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    return (
        <div className='animate-fade-in'>
            <h2 className='text-2xl font-bold mb-1'>Skills</h2>
            <p className='text-sm text-gray-500 mb-6'>Group your skills by category for ATS readability.</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map((field, index) => (
                        <SortableSkillItem key={field.id} id={field.id} index={index} remove={remove} />
                    ))}
                </SortableContext>
            </DndContext>

            <button
                type='button'
                onClick={() => append({ category: '', items: '' })}
                className='w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition'>
                + Add Skill Category
            </button>
        </div>
    );
};
