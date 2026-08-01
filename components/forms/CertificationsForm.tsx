import { CVData } from '@/lib/schema';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';
import { AddItemButton, ItemRemoveButton, SectionHeading, SortableList, SortableRow } from './shared';

const SortableCertItem = ({ id, index, remove }: { id: string; index: number; remove: (index: number) => void }) => {
    const {
        register,
        formState: { errors },
    } = useFormContext<CVData>();

    const itemErrors = errors.certifications?.[index];

    return (
        <SortableRow id={id}>
            <FormField
                className='flex-1'
                name={`certifications.${index}.name` as const}
                label='Name'
                placeholder='AWS Certified Developer'
                register={register}
                error={itemErrors?.name?.message}
            />
            <FormField
                className='flex-1'
                name={`certifications.${index}.issuer` as const}
                label='Issuer'
                placeholder='Amazon Web Services'
                register={register}
                error={itemErrors?.issuer?.message}
            />
            <FormField
                className='w-1/4'
                name={`certifications.${index}.date` as const}
                label='Date'
                placeholder='2024'
                register={register}
                error={itemErrors?.date?.message}
            />

            <ItemRemoveButton onClick={() => remove(index)} title='Remove Certification' />
        </SortableRow>
    );
};

export const CertificationsForm = () => {
    const { control } = useFormContext<CVData>();
    const { fields, append, remove, move } = useFieldArray({ control, name: 'certifications' });

    return (
        <div className='space-y-4 p-2'>
            <SectionHeading
                title='Certifications'
                description='Add professional credentials and certifications.'
            />

            <SortableList ids={fields.map((f) => f.id)} onMove={move}>
                {fields.map((field, index) => (
                    <SortableCertItem key={field.id} id={field.id} index={index} remove={remove} />
                ))}
            </SortableList>

            <AddItemButton onClick={() => append({ name: '', issuer: '', date: '' })}>
                Add Certification
            </AddItemButton>
        </div>
    );
};
