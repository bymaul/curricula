import { z } from 'zod';

export const customLinkSchema = z.object({
  url: z.string().min(1, 'URL is required'),
});

export const experienceSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  company: z.string().min(1, 'Company is required'),
  date: z.string().min(1, 'Date is required'),
  location: z.string().optional(),
  description: z.string(),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string(),
});

export const educationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  date: z.string().min(1, 'Date is required'),
  location: z.string().optional(),
  description: z.string(),
});

export const skillCategorySchema = z.object({
  category: z.string().min(1, 'Category is required'),
  items: z.string().min(1, 'Skills are required'),
});

export const certificationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().min(1, 'Date is required'),
});

export const cvSchema = z.object({
  name: z.string().min(1, 'Full Name is required'),
  jobTitle: z.string(),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  location: z.string().optional(),
  links: z.array(customLinkSchema),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
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
