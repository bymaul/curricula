import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableCertItem = ({ cert, index, updateArrayItem, removeArrayItem }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cert.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className='mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm relative flex items-center gap-4 flex-wrap sm:flex-nowrap'>
            <div {...attributes} {...listeners} className='cursor-grab text-gray-400 hover:text-black'>
                ⣿
            </div>

            <div className='flex-1 min-w-[150px]'>
                <label className='text-xs font-bold text-gray-500 uppercase'>Name *</label>
                <input
                    required
                    value={cert.name}
                    onChange={(e) => updateArrayItem('certifications', index, 'name', e.target.value)}
                    className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                />
            </div>
            <div className='flex-1 min-w-[150px]'>
                <label className='text-xs font-bold text-gray-500 uppercase'>Issuer *</label>
                <input
                    required
                    value={cert.issuer}
                    onChange={(e) => updateArrayItem('certifications', index, 'issuer', e.target.value)}
                    className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                />
            </div>
            <div className='w-full sm:w-1/4 min-w-[100px]'>
                <label className='text-xs font-bold text-gray-500 uppercase'>Date *</label>
                <input
                    required
                    value={cert.date}
                    onChange={(e) => updateArrayItem('certifications', index, 'date', e.target.value)}
                    className='w-full border-b p-1 focus:outline-none focus:border-blue-500'
                />
            </div>

            <button
                type='button'
                onClick={() => removeArrayItem('certifications', index)}
                className='text-gray-400 hover:text-red-500 font-bold mt-4'>
                ✕
            </button>
        </div>
    );
};

export const CertificationsForm = ({ cvData, setCvData, addArrayItem, updateArrayItem, removeArrayItem }: any) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = cvData.certifications.findIndex((item: any) => item.id === active.id);
            const newIndex = cvData.certifications.findIndex((item: any) => item.id === over.id);
            setCvData({ ...cvData, certifications: arrayMove(cvData.certifications, oldIndex, newIndex) });
        }
    };

    return (
        <div className='animate-fade-in'>
            <h2 className='text-2xl font-bold mb-1'>Certifications</h2>
            <p className='text-sm text-gray-500 mb-6'>Drag the handles (⣿) to reorder your certifications.</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                    items={cvData.certifications.map((c: any) => c.id)}
                    strategy={verticalListSortingStrategy}>
                    {cvData.certifications.map((cert: any, index: number) => (
                        <SortableCertItem
                            key={cert.id}
                            cert={cert}
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
                    addArrayItem('certifications', { id: `cert-${Date.now()}`, name: '', issuer: '', date: '' })
                }
                className='w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition'>
                + Add Certification
            </button>
        </div>
    );
};
