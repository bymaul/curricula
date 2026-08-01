import { SectionFieldArray } from './shared';

export const ExperienceForm = () => (
    <SectionFieldArray
        name='experience'
        title='Work Experience'
        description='Drag items using the handle to reorder your job history.'
        addLabel='Add New Experience'
        variant='card'
        itemLabel='Experience'
        removeTitle='Remove Experience'
        newItem={() => ({ role: '', company: '', date: '', location: '', description: '' })}
        fields={[
            { name: 'role', label: 'Job Title', placeholder: 'Software Engineer' },
            { name: 'company', label: 'Company', placeholder: 'Acme Inc.' },
            { name: 'location', label: 'Location', placeholder: 'Remote / New York' },
            { name: 'date', label: 'Dates', placeholder: 'Jan 2022 - Present' },
            {
                name: 'description',
                as: 'textarea',
                className: 'sm:col-span-2',
                label: 'Description / Bullet Points',
                placeholder: '- Spearheaded migration to Next.js\n- Improved load speeds by 40%',
                textareaClassName: 'h-32',
            },
        ]}
    />
);
