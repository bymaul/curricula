import { CVData } from '@/lib/schema';
import { useFieldArray, useFormContext } from 'react-hook-form';

export const PersonalForm = () => {
    const { register, control } = useFormContext<CVData>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'links',
    });

    return (
        <div className='animate-fade-in'>
            <h2 className='text-2xl font-bold mb-6'>Personal Details</h2>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Full Name</label>
                    <input
                        {...register('name')}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Target Job Title</label>
                    <input
                        {...register('jobTitle')}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Email Address</label>
                    <input
                        type='email'
                        {...register('email')}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
                <div>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Phone Number</label>
                    <input
                        {...register('phone')}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
                <div className='sm:col-span-2'>
                    <label className='text-xs font-bold text-gray-500 uppercase'>Domicile / Location</label>
                    <input
                        {...register('domicile')}
                        className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                    />
                </div>
            </div>

            <div className='mb-8'>
                <h3 className='text-sm font-bold text-gray-700 uppercase mb-3'>Custom Links</h3>
                {fields.map((field, index) => (
                    <div key={field.id} className='flex gap-3 mb-3 items-end'>
                        <div className='flex-1'>
                            <label className='text-xs font-bold text-gray-500 uppercase'>
                                URL (e.g., github.com/username)
                            </label>
                            <input
                                {...register(`links.${index}.url` as const)}
                                className='w-full border-b p-2 focus:outline-none focus:border-blue-500 bg-transparent'
                            />
                        </div>
                        <button
                            type='button'
                            onClick={() => remove(index)}
                            className='text-gray-400 hover:text-red-500 pb-2 font-bold'>
                            ✕
                        </button>
                    </div>
                ))}
                <button
                    type='button'
                    onClick={() => append({ url: '' })}
                    className='text-xs font-bold text-blue-600 mt-1 hover:underline'>
                    + Add Link
                </button>
            </div>

            <div>
                <h3 className='text-sm font-bold text-gray-700 uppercase mb-2'>Professional Summary</h3>
                <textarea
                    {...register('summary')}
                    placeholder='A brief overview of your professional background...'
                    className='w-full border p-3 rounded-lg focus:outline-none focus:border-blue-500 min-h-30 bg-gray-50 focus:bg-white transition-colors'
                />
            </div>
        </div>
    );
};
