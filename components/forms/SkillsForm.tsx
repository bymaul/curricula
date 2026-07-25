import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableSkillItem = ({ skill, index, updateArrayItem, removeArrayItem }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: skill.id });
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
                <label className='text-xs font-bold text-gray-500 uppercase'>Category *</label>
                <input
                    required
                    placeholder='e.g., Languages'
                    value={skill.category}
                    onChange={(e) => updateArrayItem('skills', index, 'category', e.target.value)}
                    className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                />
            </div>
            <div className='flex-1'>
                <label className='text-xs font-bold text-gray-500 uppercase'>Skills (Comma Separated) *</label>
                <input
                    required
                    placeholder='React, TypeScript, Next.js...'
                    value={skill.items}
                    onChange={(e) => updateArrayItem('skills', index, 'items', e.target.value)}
                    className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                />
            </div>

            <button
                type='button'
                onClick={() => removeArrayItem('skills', index)}
                className='text-gray-400 hover:text-red-500 font-bold mt-4'>
                ✕
            </button>
        </div>
    );
};

export const SkillsForm = ({ cvData, setCvData, addArrayItem, updateArrayItem, removeArrayItem }: any) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = cvData.skills.findIndex((item: any) => item.id === active.id);
            const newIndex = cvData.skills.findIndex((item: any) => item.id === over.id);
            setCvData({ ...cvData, skills: arrayMove(cvData.skills, oldIndex, newIndex) });
        }
    };

    return (
        <div className='animate-fade-in'>
            <h2 className='text-2xl font-bold mb-1'>Skills</h2>
            <p className='text-sm text-gray-500 mb-6'>Group your skills by category for ATS readability.</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={cvData.skills.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
                    {cvData.skills.map((skill: any, index: number) => (
                        <SortableSkillItem
                            key={skill.id}
                            skill={skill}
                            index={index}
                            updateArrayItem={updateArrayItem}
                            removeArrayItem={removeArrayItem}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            <button
                type='button'
                onClick={() => addArrayItem('skills', { id: `skill-${Date.now()}`, category: '', items: '' })}
                className='w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition'>
                + Add Skill Category
            </button>
        </div>
    );
};
