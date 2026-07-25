import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableProjectItem = ({ proj, index, updateArrayItem, removeArrayItem }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: proj.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

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
                onClick={() => removeArrayItem('projects', index)}
                className='absolute top-4 right-4 text-red-500 text-xs font-bold hover:underline'>
                Remove
            </button>

            <div className='pl-6'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
                    <div>
                        <label className='text-xs font-bold text-gray-500 uppercase'>Project Name *</label>
                        <input
                            required
                            value={proj.name}
                            onChange={(e) => updateArrayItem('projects', index, 'name', e.target.value)}
                            className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                        />
                    </div>
                    <div>
                        <label className='text-xs font-bold text-gray-500 uppercase'>Dates *</label>
                        <input
                            required
                            value={proj.date}
                            onChange={(e) => updateArrayItem('projects', index, 'date', e.target.value)}
                            className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                        />
                    </div>
                </div>

                <label className='text-xs font-bold text-gray-500 uppercase'>Description / Bullet Points</label>
                <textarea
                    value={proj.description}
                    onChange={(e) => updateArrayItem('projects', index, 'description', e.target.value)}
                    placeholder='Paste your bullet points here. Use dashes (-) or new lines to separate them.'
                    className='w-full border p-2 rounded text-sm h-32 bg-gray-50 focus:bg-white resize-y mt-1'
                />
            </div>
        </div>
    );
};

export const ProjectsForm = ({
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
            const oldIndex = cvData.projects.findIndex((item: any) => item.id === active.id);
            const newIndex = cvData.projects.findIndex((item: any) => item.id === over.id);
            setCvData({ ...cvData, projects: arrayMove(cvData.projects, oldIndex, newIndex) });
        }
    };

    return (
        <div className='animate-fade-in'>
            <h2 className='text-2xl font-bold mb-1'>Projects</h2>
            <p className='text-sm text-gray-500 mb-6'>Drag the handles (⣿) to reorder your projects.</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={cvData.projects.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
                    {cvData.projects.map((proj: any, index: number) => (
                        <SortableProjectItem
                            key={proj.id}
                            proj={proj}
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
                type='button'
                onClick={() =>
                    addArrayItem('projects', { id: `proj-${Date.now()}`, name: '', date: '', achievements: [''] })
                }
                className='w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition'>
                + Add New Project
            </button>
        </div>
    );
};
