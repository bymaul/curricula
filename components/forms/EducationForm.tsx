import { CVData } from '@/lib/schema';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';
import { AddItemButton, SectionHeading, SortableCard, SortableList } from './shared';

const SortableEducationItem = ({
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

    const itemErrors = errors.education?.[index];

    return (
        <SortableCard
            id={id}
            label={`Education #${index + 1}`}
            onRemove={() => remove(index)}
            removeTitle='Remove Education'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <FormField
                    name={`education.${index}.institution` as const}
                    label='Institution'
                    placeholder='University of California'
                    register={register}
                    error={itemErrors?.institution?.message}
                />
                <FormField
                    name={`education.${index}.degree` as const}
                    label='Degree / Major'
                    placeholder='B.S. in Computer Science'
                    register={register}
                    error={itemErrors?.degree?.message}
                />
                <FormField
                    name={`education.${index}.location` as const}
                    label='Location'
                    placeholder='Berkeley, CA'
                    register={register}
                    error={itemErrors?.location?.message}
                />
                <FormField
                    name={`education.${index}.date` as const}
                    label='Dates'
                    placeholder='2018 - 2022'
                    register={register}
                    error={itemErrors?.date?.message}
                />
                <FormField
                    as='textarea'
                    className='sm:col-span-2'
                    name={`education.${index}.description` as const}
                    label='Summary / Highlights'
                    placeholder='GPA: 3.8 / Dean’s List...'
                    register={register}
                    error={itemErrors?.description?.message}
                    textareaClassName='h-24'
                />
            </div>
        </SortableCard>
    );
};

export const EducationForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'education' });

    return (
        <div className='space-y-4 p-2'>
            <SectionHeading
                title='Education'
                description='Add your academic background and credentials.'
            />

            <SortableList ids={fields.map((f) => f.id)} onMove={move}>
                {fields.map((field, index) => (
                    <SortableEducationItem key={field.id} id={field.id} index={index} remove={remove} />
                ))}
            </SortableList>

            <AddItemButton
                onClick={() => append({ institution: '', degree: '', date: '', location: '', description: '' })}>
                Add Education
            </AddItemButton>
        </div>
    );
};
