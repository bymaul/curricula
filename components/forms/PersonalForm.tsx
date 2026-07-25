import React from 'react';

export const PersonalForm = ({ cvData, setCvData, updateArrayItem, addArrayItem, removeArrayItem }: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCvData({ ...cvData, [e.target.name]: e.target.value });
    };

    return (
        <div className='animate-fade-in'>
            <h2 className='text-2xl font-bold mb-6'>Personal Details</h2>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Full Name *</label>
                    <input
                        required
                        name='name'
                        value={cvData.name}
                        onChange={handleChange}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Target Job Title</label>
                    <input
                        name='jobTitle'
                        value={cvData.jobTitle}
                        onChange={handleChange}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Email Address *</label>
                    <input
                        required
                        type='email'
                        name='email'
                        value={cvData.email}
                        onChange={handleChange}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Phone Number</label>
                    <input
                        name='phone'
                        value={cvData.phone}
                        onChange={handleChange}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Domicile</label>
                    <input
                        name='domicile'
                        value={cvData.domicile}
                        onChange={handleChange}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
            </div>

            <div className='mb-8'>
                <h3 className='text-sm font-bold text-gray-700 uppercase mb-3'>Custom Links</h3>
                {cvData.links.map((link: any, i: number) => (
                    <div key={i} className='flex gap-3 mb-3 items-end'>
                        <div className='flex-1'>
                            <label className='text-xs font-bold text-gray-500 uppercase'>URL</label>
                            <input
                                required
                                placeholder='https://'
                                value={link.url}
                                onChange={(e) => updateArrayItem('links', i, 'url', e.target.value)}
                                className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                            />
                        </div>
                        <button
                            type='button'
                            onClick={() => removeArrayItem('links', i)}
                            className='text-gray-400 hover:text-red-500 pb-2 font-bold'>
                            ✕
                        </button>
                    </div>
                ))}
                <button
                    type='button'
                    onClick={() => addArrayItem('links', { label: '', url: '' })}
                    className='text-xs font-bold text-blue-600 mt-1 hover:underline'>
                    + Add Another Link
                </button>
            </div>

            <div>
                <h3 className='text-sm font-bold text-gray-700 uppercase mb-2'>Professional Summary</h3>
                <textarea
                    name='summary'
                    value={cvData.summary}
                    onChange={handleChange}
                    placeholder='A brief overview of your professional background...'
                    className='w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500 min-h-[120px] bg-gray-50 focus:bg-white transition-colors'
                />
            </div>
        </div>
    );
};
