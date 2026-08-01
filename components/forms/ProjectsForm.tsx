import { SectionFieldArray } from './shared';

export const ProjectsForm = () => (
    <SectionFieldArray
        name='projects'
        title='Projects'
        description='Highlight side projects or open-source work.'
        addLabel='Add New Project'
        variant='card'
        itemLabel='Project'
        removeTitle='Remove Project'
        newItem={() => ({ name: '', date: '', description: '' })}
        fields={[
            { name: 'name', label: 'Project Name', placeholder: 'E-Commerce SaaS Platform' },
            { name: 'date', label: 'Dates', placeholder: '2023 - Present' },
            {
                name: 'description',
                as: 'textarea',
                className: 'sm:col-span-2',
                label: 'Description / Bullet Points',
                placeholder: '- Built with Next.js, Tailwind, and PostgreSQL...',
                textareaClassName: 'h-32 font-mono text-xs',
            },
        ]}
    />
);
