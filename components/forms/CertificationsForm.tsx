import { SectionFieldArray } from './shared';

export const CertificationsForm = () => (
  <SectionFieldArray
    name="certifications"
    title="Certifications"
    description="Add professional credentials and certifications."
    addLabel="Add Certification"
    variant="row"
    removeTitle="Remove Certification"
    newItem={() => ({ name: '', issuer: '', date: '' })}
    fields={[
      {
        name: 'name',
        className: 'flex-1',
        label: 'Name',
        placeholder: 'AWS Certified Developer',
      },
      {
        name: 'issuer',
        className: 'flex-1',
        label: 'Issuer',
        placeholder: 'Amazon Web Services',
      },
      { name: 'date', className: 'w-1/4', label: 'Date', placeholder: '2024' },
    ]}
  />
);
