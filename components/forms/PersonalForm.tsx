import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CVData } from '@/lib/schema';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

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
        <div className='animate-fade-in space-y-6'>
            <div>
                <h2 className='text-xl font-bold tracking-tight'>Personal Details</h2>
                <p className='text-xs text-muted-foreground mt-1'>
                    Get started with your contact information and summary.
                </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                    <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block'>
                        Full Name
                    </label>
                    <Input
                        {...register('name')}
                        placeholder='e.g. Alex Johnson'
                        className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.name && (
                        <p className='text-destructive text-[11px] mt-1 font-medium'>{errors.name.message}</p>
                    )}
                </div>
                <div>
                    <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block'>
                        Job Title
                    </label>
                    <Input
                        {...register('jobTitle')}
                        placeholder='e.g. Senior Software Engineer'
                        className={errors.jobTitle ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.jobTitle && (
                        <p className='text-destructive text-[11px] mt-1 font-medium'>{errors.jobTitle.message}</p>
                    )}
                </div>
                <div>
                    <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block'>
                        Email Address
                    </label>
                    <Input
                        type='email'
                        {...register('email')}
                        placeholder='alex@example.com'
                        className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.email && (
                        <p className='text-destructive text-[11px] mt-1 font-medium'>{errors.email.message}</p>
                    )}
                </div>
                <div>
                    <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block'>
                        Phone Number
                    </label>
                    <Input
                        {...register('phone')}
                        placeholder='+1 (555) 000-0000'
                        className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.phone && (
                        <p className='text-destructive text-[11px] mt-1 font-medium'>{errors.phone.message}</p>
                    )}
                </div>
                <div className='sm:col-span-2'>
                    <label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block'>
                        Domicile / Location (Optional)
                    </label>
                    <Input {...register('domicile')} placeholder='e.g. San Francisco, CA' />
                </div>
            </div>

            <div className='space-y-4 pt-2 border-t border-border'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>Custom Links</h3>
                </div>
                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className='flex flex-col space-y-1.5 bg-muted/20 p-3 rounded-xl border border-border relative'>
                        <div className='flex gap-3 items-end'>
                            <div className='flex-1'>
                                <label className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block'>
                                    URL (e.g., github.com/username)
                                </label>
                                <Input
                                    {...register(`links.${index}.url` as const)}
                                    placeholder='github.com/username'
                                    className={errors.links?.[index]?.url ? 'border-destructive' : ''}
                                />
                            </div>
                            {/* Unified Delete Button */}
                            <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                onClick={() => remove(index)}
                                className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0 rounded-lg transition-colors'
                                title='Remove Link'>
                                <Trash2 className='w-4 h-4' />
                            </Button>
                        </div>
                        {errors.links?.[index]?.url && (
                            <p className='text-destructive text-[11px] font-medium'>
                                {errors.links[index]?.url?.message}
                            </p>
                        )}
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
            </div>

            <div className='pt-2 border-t border-border'>
                <h3 className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2'>
                    Professional Summary
                </h3>
                <Textarea
                    {...register('summary')}
                    placeholder='A brief overview of your professional background, key achievements, and core strengths...'
                    className={`min-h-30 resize-y ${errors.summary ? 'border-destructive' : ''}`}
                />
                {errors.summary && (
                    <p className='text-destructive text-[11px] mt-1 font-medium'>{errors.summary.message}</p>
                )}
            </div>
        </div>
    );
};
