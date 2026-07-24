export interface CustomLink {
    label: string;
    url: string;
}

export interface Experience {
    role: string;
    company: string;
    date: string;
    achievements: string[];
}

export interface Project {
    name: string;
    date: string;
    achievements: string[];
}

export interface Education {
    degree: string;
    institution: string;
    date: string;
    gpa: string;
}

export interface SkillCategory {
    category: string; // e.g., "Languages", "Frameworks"
    items: string; // e.g., "JavaScript, TypeScript, Python"
}

export interface Certification {
    name: string;
    issuer: string;
    date: string;
}

export interface CVData {
    name: string;
    jobTitle: string; // Added Job Title
    email: string;
    phone: string;
    links: CustomLink[]; // Replaces the single hardcoded LinkedIn string
    summary: string; // Added Summary
    experience: Experience[];
    projects: Project[];
    education: Education[];
    skills: SkillCategory[]; // Updated to categorized skills
    certifications: Certification[];
}

export const initialCVState: CVData = {
    name: '',
    jobTitle: '',
    email: '',
    phone: '',
    links: [{ label: 'LinkedIn', url: '' }],
    summary: '',
    experience: [],
    projects: [],
    education: [],
    skills: [],
    certifications: [],
};
