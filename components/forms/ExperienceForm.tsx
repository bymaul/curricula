import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Wrapper ---
// This is the individual draggable card
const SortableExperienceItem = ({
    exp,
    index,
    updateArrayItem,
    removeArrayItem,
    updateAchievement,
    addAchievement,
    removeAchievement,
    handleAchievementPaste,
}: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exp.id }); // Requires a unique ID

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className='mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm relative group'>
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className='absolute left-2 top-4 cursor-grab text-gray-400 hover:text-black'>
                ⣿
            </div>

            <button
                onClick={() => removeArrayItem('experience', index)}
                className='absolute top-4 right-4 text-red-500 text-xs font-bold hover:underline'>
                Remove
            </button>

            <div className='pl-6'>
                <div className='grid grid-cols-2 gap-3 mb-3'>
                    <div>
                        <label className='text-xs font-bold text-gray-500 uppercase'>Job Title *</label>
                        <input
                            required
                            value={exp.role}
                            onChange={(e) => updateArrayItem('experience', index, 'role', e.target.value)}
                            className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                        />
                    </div>
                    <div>
                        <label className='text-xs font-bold text-gray-500 uppercase'>Company *</label>
                        <input
                            required
                            value={exp.company}
                            onChange={(e) => updateArrayItem('experience', index, 'company', e.target.value)}
                            className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                        />
                    </div>
                    <div className='col-span-2'>
                        <label className='text-xs font-bold text-gray-500 uppercase'>Dates *</label>
                        <input
                            required
                            value={exp.date}
                            onChange={(e) => updateArrayItem('experience', index, 'date', e.target.value)}
                            className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                        />
                    </div>
                </div>

                {/* Single Textarea for the entire description */}
                <label className='text-xs font-bold text-gray-500 uppercase'>Description / Bullet Points</label>
                <textarea
                    value={exp.description}
                    onChange={(e) => updateArrayItem('experience', index, 'description', e.target.value)}
                    placeholder='Paste your bullet points here. Use dashes (-) or new lines to separate them.'
                    className='w-full border p-2 rounded text-sm h-32 bg-gray-50 focus:bg-white resize-y mt-1'
                />
            </div>
        </div>
    );
};

// --- Main Form Component ---
export const ExperienceForm = ({
    cvData,
    setCvData,
    addArrayItem,
    updateArrayItem,
    removeArrayItem,
    updateAchievement,
    addAchievement,
    removeAchievement,
}: any) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = cvData.experience.findIndex((item: any) => item.id === active.id);
            const newIndex = cvData.experience.findIndex((item: any) => item.id === over.id);
            const newExperience = arrayMove(cvData.experience, oldIndex, newIndex);
            setCvData({ ...cvData, experience: newExperience });
        }
    };

    return (
        <div className='animate-fade-in'>
            <h2 className='text-2xl font-bold mb-1'>Work Experience</h2>
            <p className='text-sm text-gray-500 mb-6'>Drag the handles (⣿) to reorder your jobs.</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={cvData.experience.map((e: any) => e.id)} strategy={verticalListSortingStrategy}>
                    {cvData.experience.map((exp: any, index: number) => (
                        <SortableExperienceItem
                            key={exp.id}
                            exp={exp}
                            index={index}
                            updateArrayItem={updateArrayItem}
                            removeArrayItem={removeArrayItem}
                            updateAchievement={updateAchievement}
                            addAchievement={addAchievement}
                            removeAchievement={removeAchievement}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            <button
                onClick={() =>
                    addArrayItem('experience', {
                        id: `exp-${Date.now()}`,
                        role: '',
                        company: '',
                        date: '',
                        achievements: [''],
                    })
                }
                className='w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition'>
                + Add New Experience
            </button>
        </div>
    );
};
