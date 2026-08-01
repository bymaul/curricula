import { CVData } from '@/lib/schema';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';
import { AddItemButton, SectionHeading, SortableCard, SortableList } from './shared';

const SortableProjectItem = ({ id, index, remove }: { id: string; index: number; remove: (index: number) => void }) => {
    const {
        register,
        formState: { errors },
    } = useFormContext<CVData>();

    const itemErrors = errors.projects?.[index];

    return (
        <SortableCard
            id={id}
            label={`Project #${index + 1}`}
            onRemove={() => remove(index)}
            removeTitle='Remove Project'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <FormField
                    name={`projects.${index}.name` as const}
                    label='Project Name'
                    placeholder='E-Commerce SaaS Platform'
                    register={register}
                    error={itemErrors?.name?.message}
                />
                <FormField
                    name={`projects.${index}.date` as const}
                    label='Dates'
                    placeholder='2023 - Present'
                    register={register}
                    error={itemErrors?.date?.message}
                />
            </div>

            <FormField
                as='textarea'
                name={`projects.${index}.description` as const}
                label='Description / Bullet Points'
                placeholder='- Built with Next.js, Tailwind, and PostgreSQL...'
                register={register}
                error={itemErrors?.description?.message}
                textareaClassName='h-32 font-mono text-xs'
            />
        </SortableCard>
    );
};

export const ProjectsForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'projects' });

    return (
        <div className='space-y-4 p-2'>
            <SectionHeading
                title='Projects'
                description='Highlight side projects or open-source work.'
            />

            <SortableList ids={fields.map((f) => f.id)} onMove={move}>
                {fields.map((field, index) => (
                    <SortableProjectItem key={field.id} id={field.id} index={index} remove={remove} />
                ))}
            </SortableList>

            <AddItemButton onClick={() => append({ name: '', date: '', description: '' })}>
                Add New Project
            </AddItemButton>
        </div>
    );
};
