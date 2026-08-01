import { SectionFieldArray } from './shared';

export const EducationForm = () => (
  <SectionFieldArray
    name="education"
    title="Education"
    description="Add your academic background and credentials."
    addLabel="Add Education"
    variant="card"
    itemLabel="Education"
    removeTitle="Remove Education"
    newItem={() => ({
      institution: '',
      degree: '',
      date: '',
      location: '',
      description: '',
    })}
    fields={[
      {
        name: 'institution',
        label: 'Institution',
        placeholder: 'University of California',
      },
      {
        name: 'degree',
        label: 'Degree / Major',
        placeholder: 'B.S. in Computer Science',
      },
      { name: 'location', label: 'Location', placeholder: 'Berkeley, CA' },
      { name: 'date', label: 'Dates', placeholder: '2018 - 2022' },
      {
        name: 'description',
        as: 'textarea',
        className: 'sm:col-span-2',
        label: 'Summary / Highlights',
        placeholder: 'GPA: 3.8 / Dean’s List...',
        textareaClassName: 'h-24',
      },
    ]}
  />
);
