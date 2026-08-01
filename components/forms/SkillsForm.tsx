import { CVData } from '@/lib/schema';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';
import { AddItemButton, ItemRemoveButton, SectionHeading, SortableList, SortableRow } from './shared';

const SortableSkillItem = ({ id, index, remove }: { id: string; index: number; remove: (index: number) => void }) => {
    const {
        register,
        formState: { errors },
    } = useFormContext<CVData>();

    const itemErrors = errors.skills?.[index];

    return (
        <SortableRow id={id}>
            <FormField
                className='w-1/3'
                name={`skills.${index}.category` as const}
                label='Category'
                placeholder='Languages'
                register={register}
                error={itemErrors?.category?.message}
            />

            <FormField
                className='flex-1'
                name={`skills.${index}.items` as const}
                label='Skills'
                placeholder='TypeScript, Python, SQL...'
                register={register}
                error={itemErrors?.items?.message}
            />

            <ItemRemoveButton onClick={() => remove(index)} title='Remove Skill Category' />
        </SortableRow>
    );
};

export const SkillsForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'skills' });

    return (
        <div className='space-y-4 p-2'>
            <SectionHeading
                title='Skills'
                description='Group your technical and soft skills by category for ATS readability.'
            />

            <SortableList ids={fields.map((f) => f.id)} onMove={move}>
                {fields.map((field, index) => (
                    <SortableSkillItem key={field.id} id={field.id} index={index} remove={remove} />
                ))}
            </SortableList>

            <AddItemButton onClick={() => append({ category: '', items: '' })}>Add Skill Category</AddItemButton>
        </div>
    );
};
