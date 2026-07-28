import { Button } from '@/components/ui/button';
import { FieldGroup, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { CVData } from '@/lib/schema';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';

export const PersonalForm = () => {
    const {
        register,
        control,
        formState: { errors },
    } = useFormContext<CVData>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'links',
    });

    return (
        <div className='p-2'>
            <div className='mb-4'>
                <h2 className='text-xl font-bold tracking-tight'>Personal Details</h2>
                <p className='text-xs text-muted-foreground mt-1'>
                    Get started with your contact information and summary.
                </p>
            </div>

            <FieldGroup>
                <FieldSet>
                    <FieldLegend>Contact Information</FieldLegend>

                    <FieldGroup className='grid grid-cols-1 sm:grid-cols-2'>
                        <FormField
                            name='name'
                            label='Full Name'
                            placeholder='e.g. Alex Johnson'
                            register={register}
                            error={errors.name?.message}
                        />
                        <FormField
                            name='jobTitle'
                            label='Job Title'
                            placeholder='e.g. Senior Software Engineer'
                            register={register}
                            error={errors.jobTitle?.message}
                        />
                        <FormField
                            name='email'
                            label='Email Address'
                            type='email'
                            placeholder='alex@example.com'
                            register={register}
                            error={errors.email?.message}
                        />
                        <FormField
                            name='phone'
                            label='Phone Number'
                            placeholder='+1 (555) 000-0000'
                            register={register}
                            error={errors.phone?.message}
                        />
                        <FormField
                            name='location'
                            label='Location (Optional)'
                            placeholder='e.g. San Francisco, CA'
                            register={register}
                            className='sm:col-span-2'
                        />
                    </FieldGroup>
                </FieldSet>

                <FieldSeparator />

                <FieldSet>
                    <FieldLegend>Custom Links</FieldLegend>
                    <FieldGroup>
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className='flex flex-col space-y-1.5 bg-muted/20 p-3 rounded-xl border border-border relative'>
                                <div className='flex gap-3 items-end'>
                                    <FormField
                                        name={`links.${index}.url` as const}
                                        label='URL (e.g., github.com/username)'
                                        placeholder='github.com/username'
                                        register={register}
                                        error={errors.links?.[index]?.url?.message}
                                        className='flex-1'
                                    />

                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon'
                                        onClick={() => remove(index)}
                                        className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'
                                        title='Remove Link'>
                                        <Trash2 className='w-4 h-4' />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => append({ url: '' })}
                            className='w-full border-dashed gap-2'>
                            <Plus className='w-4 h-4' /> Add Link
                        </Button>
                    </FieldGroup>
                </FieldSet>

                <FieldSeparator />

                <FieldSet>
                    <FieldLegend>Professional Summary</FieldLegend>
                    <FieldGroup>
                        <FormField
                            as='textarea'
                            name='summary'
                            placeholder='A brief overview of your professional background, key achievements, and core strengths...'
                            register={register}
                            error={errors.summary?.message}
                        />
                    </FieldGroup>
                </FieldSet>
            </FieldGroup>
        </div>
    );
};
