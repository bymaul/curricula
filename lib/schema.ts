import { z } from 'zod';

export const customLinkSchema = z.object({
    url: z.string(),
});

export const experienceSchema = z.object({
    role: z.string(),
    company: z.string(),
    date: z.string(),
    location: z.string(),
    description: z.string(),
});

export const projectSchema = z.object({
    name: z.string(),
    date: z.string(),
    description: z.string(),
});

export const educationSchema = z.object({
    degree: z.string(),
    institution: z.string(),
    date: z.string(),
    location: z.string(),
    description: z.string(),
});

export const skillCategorySchema = z.object({
    category: z.string(),
    items: z.string(),
});

export const certificationSchema = z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
});

export const cvSchema = z.object({
    name: z.string().optional(),
    jobTitle: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    domicile: z.string().optional(),
    links: z.array(customLinkSchema),
    summary: z.string().optional(),
    experience: z.array(experienceSchema),
    projects: z.array(projectSchema),
    education: z.array(educationSchema),
    skills: z.array(skillCategorySchema),
    certifications: z.array(certificationSchema),
});

export type CVData = z.infer<typeof cvSchema>;

export const initialCVState: CVData = {
    name: '',
    jobTitle: '',
    email: '',
    phone: '',
    domicile: '',
    links: [],
    summary: '',
    experience: [],
    projects: [],
    education: [],
    skills: [],
    certifications: [],
};
