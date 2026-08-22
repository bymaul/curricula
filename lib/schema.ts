import { z } from 'zod';

export const customLinkSchema = z.object({
  url: z.string().min(1, 'validation.urlRequired'),
});

export const experienceSchema = z.object({
  role: z.string().min(1, 'validation.roleRequired'),
  company: z.string().min(1, 'validation.companyRequired'),
  date: z.string().min(1, 'validation.dateRequired'),
  location: z.string().optional(),
  description: z.string(),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'validation.projectNameRequired'),
  date: z.string().min(1, 'validation.dateRequired'),
  description: z.string(),
});

export const educationSchema = z.object({
  degree: z.string().min(1, 'validation.degreeRequired'),
  institution: z.string().min(1, 'validation.institutionRequired'),
  date: z.string().min(1, 'validation.dateRequired'),
  location: z.string().optional(),
  description: z.string(),
});

export const skillCategorySchema = z.object({
  category: z.string().min(1, 'validation.categoryRequired'),
  items: z.string().min(1, 'validation.skillsRequired'),
});

export const certificationSchema = z.object({
  name: z.string().min(1, 'validation.nameRequired'),
  issuer: z.string().min(1, 'validation.issuerRequired'),
  date: z.string().min(1, 'validation.dateRequired'),
});

export const cvSchema = z.object({
  name: z.string().min(1, 'validation.fullNameRequired'),
  jobTitle: z.string(),
  email: z
    .string()
    .min(1, 'validation.emailRequired')
    .email('validation.emailInvalid'),
  phone: z.string().min(1, 'validation.phoneRequired'),
  location: z.string().optional(),
  links: z.array(customLinkSchema),
  summary: z.string().min(10, 'validation.summaryMinLength'),
  experience: z.array(experienceSchema),
  projects: z.array(projectSchema),
  education: z.array(educationSchema),
  skills: z.array(skillCategorySchema),
  certifications: z.array(certificationSchema),
});

export type CVData = z.infer<typeof cvSchema>;

export const cvDataStoredSchema = z.object({
  name: z.string(),
  jobTitle: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string().optional(),
  links: z.array(z.object({ url: z.string() })),
  summary: z.string(),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      date: z.string(),
      location: z.string().optional(),
      description: z.string(),
    }),
  ),
  projects: z.array(
    z.object({ name: z.string(), date: z.string(), description: z.string() }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      date: z.string(),
      location: z.string().optional(),
      description: z.string(),
    }),
  ),
  skills: z.array(z.object({ category: z.string(), items: z.string() })),
  certifications: z.array(
    z.object({ name: z.string(), issuer: z.string(), date: z.string() }),
  ),
});

export const initialCVState: CVData = {
  name: '',
  jobTitle: '',
  email: '',
  phone: '',
  location: '',
  links: [],
  summary: '',
  experience: [],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
};
