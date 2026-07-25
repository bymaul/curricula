import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableEducationItem = ({ edu, index, updateArrayItem, removeArrayItem }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: edu.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className='mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm relative group'>
            <div
                {...attributes}
                {...listeners}
                className='absolute left-2 top-4 cursor-grab text-gray-400 hover:text-black'>
                ⣿
            </div>
            <button
                type='button'
                onClick={() => removeArrayItem('education', index)}
                className='absolute top-4 right-4 text-red-500 text-xs font-bold hover:underline'>
                Remove
            </button>

            <div className='pl-6 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Institution *</label>
                    <input
                        required
                        value={edu.institution}
                        onChange={(e) => updateArrayItem('education', index, 'institution', e.target.value)}
                        className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Degree / Major *</label>
                    <input
                        required
                        value={edu.degree}
                        onChange={(e) => updateArrayItem('education', index, 'degree', e.target.value)}
                        className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Dates *</label>
                    <input
                        required
                        value={edu.date}
                        onChange={(e) => updateArrayItem('education', index, 'date', e.target.value)}
                        className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                    />
                </div>
            </div>

            <label className='text-xs font-bold text-gray-500 uppercase'>Description / Bullet Points</label>
            <textarea
                value={edu.description}
                onChange={(e) => updateArrayItem('education', index, 'description', e.target.value)}
                placeholder='Paste your bullet points here. Use dashes (-) or new lines to separate them.'
                className='w-full border p-2 rounded text-sm h-32 bg-gray-50 focus:bg-white resize-y mt-1'
            />
        </div>
    );
};

export const EducationForm = ({ cvData, setCvData, addArrayItem, updateArrayItem, removeArrayItem }: any) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = cvData.education.findIndex((item: any) => item.id === active.id);
            const newIndex = cvData.education.findIndex((item: any) => item.id === over.id);
            setCvData({ ...cvData, education: arrayMove(cvData.education, oldIndex, newIndex) });
        }
    };

    return (
        <div className='animate-fade-in'>
            <h2 className='text-2xl font-bold mb-1'>Education</h2>
            <p className='text-sm text-gray-500 mb-6'>Drag the handles (⣿) to reorder.</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={cvData.education.map((e: any) => e.id)} strategy={verticalListSortingStrategy}>
                    {cvData.education.map((edu: any, index: number) => (
                        <SortableEducationItem
                            key={edu.id}
                            edu={edu}
                            index={index}
                            updateArrayItem={updateArrayItem}
                            removeArrayItem={removeArrayItem}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            <button
                type='button'
                onClick={() =>
                    addArrayItem('education', {
                        id: `edu-${Date.now()}`,
                        institution: '',
                        degree: '',
                        date: '',
                        gpa: '',
                    })
                }
                className='w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition'>
                + Add Education
            </button>
        </div>
    );
};
