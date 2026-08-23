import { CVData } from '@/lib/schema';

/**
 * A realistic, schema-valid example CV used by the "start from example"
 * actions. Content is intentionally generic and English-only; the resume's
 * own language stays editable afterwards.
 */
export const SAMPLE_CV_DATA: CVData = {
  name: 'Alex Rivera',
  jobTitle: 'Senior Frontend Engineer',
  email: 'alex.rivera@example.com',
  phone: '+1 555 0134',
  location: 'Portland, OR',
  links: [{ url: 'github.com/alexriv' }],
  summary:
    'Frontend engineer with 8 years of experience building accessible,\nperformant web applications. Comfortable owning features end to end, from design collaboration to production monitoring.',
  experience: [
    {
      role: 'Senior Frontend Engineer',
      company: 'Northwind Labs',
      date: '2021 - Present',
      location: 'Remote',
      description:
        '- Led the migration of a legacy dashboard to React and TypeScript, cutting bundle size by 40%\n- Built a shared component library adopted by 4 product teams\n- Mentored 3 junior engineers through structured code review',
    },
    {
      role: 'Frontend Engineer',
      company: 'Brightpath',
      date: '2018 - 2021',
      location: 'Portland, OR',
      description:
        '- Shipped a customer onboarding flow that raised activation by 18%\n- Introduced automated accessibility checks into CI\n- Maintained a design system used across web and email templates',
    },
  ],
  projects: [
    {
      name: 'OpenAtlas',
      date: '2023',
      description:
        '- Open-source map toolkit with 2k+ GitHub stars\n- Focuses on offline tile caching for field research apps',
    },
  ],
  education: [
    {
      degree: 'B.S. Computer Science',
      institution: 'University of Oregon',
      date: '2014 - 2018',
      location: 'Eugene, OR',
      description: '',
    },
  ],
  skills: [
    { category: 'Languages', items: 'TypeScript, JavaScript, HTML, CSS' },
    {
      category: 'Frameworks',
      items: 'React, Next.js, Node.js, Tailwind CSS',
    },
    { category: 'Practices', items: 'Accessibility, Testing, Performance' },
  ],
  certifications: [
    {
      name: 'AWS Certified Developer',
      issuer: 'Amazon Web Services',
      date: '2022',
    },
  ],
};
