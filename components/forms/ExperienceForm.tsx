import { CVData } from '@/lib/schema';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';
import { AddItemButton, SectionHeading, SortableCard, SortableList } from './shared';

const SortableExperienceItem = ({
    id,
    index,
    remove,
}: {
    id: string;
    index: number;
    remove: (index: number) => void;
}) => {
    const {
        register,
        formState: { errors },
    } = useFormContext<CVData>();

    const itemErrors = errors.experience?.[index];

    return (
        <SortableCard
            id={id}
            label={`Experience #${index + 1}`}
            onRemove={() => remove(index)}
            removeTitle='Remove Experience'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <FormField
                    name={`experience.${index}.role` as const}
                    label='Job Title'
                    placeholder='Software Engineer'
                    register={register}
                    error={itemErrors?.role?.message}
                />
                <FormField
                    name={`experience.${index}.company` as const}
                    label='Company'
                    placeholder='Acme Inc.'
                    register={register}
                    error={itemErrors?.company?.message}
                />
                <FormField
                    name={`experience.${index}.location` as const}
                    label='Location'
                    placeholder='Remote / New York'
                    register={register}
                    error={itemErrors?.location?.message}
                />
                <FormField
                    name={`experience.${index}.date` as const}
                    label='Dates'
                    placeholder='Jan 2022 - Present'
                    register={register}
                    error={itemErrors?.date?.message}
                />
            </div>

            <FormField
                as='textarea'
                name={`experience.${index}.description` as const}
                label='Description / Bullet Points'
                placeholder={`- Spearheaded migration to Next.js\n- Improved load speeds by 40%`}
                register={register}
                error={itemErrors?.description?.message}
                textareaClassName='h-32 font-mono text-xs'
            />
        </SortableCard>
    );
};

export const ExperienceForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'experience' });

    return (
        <div className='space-y-4 p-2'>
            <SectionHeading
                title='Work Experience'
                description='Drag items using the handle to reorder your job history.'
            />

            <SortableList ids={fields.map((f) => f.id)} onMove={move}>
                {fields.map((field, index) => (
                    <SortableExperienceItem key={field.id} id={field.id} index={index} remove={remove} />
                ))}
            </SortableList>

            <AddItemButton
                onClick={() => append({ role: '', company: '', date: '', location: '', description: '' })}>
                Add New Experience
            </AddItemButton>
        </div>
    );
};
