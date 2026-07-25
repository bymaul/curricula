export interface CustomLink {
    url: string;
}

export interface Experience {
    role: string;
    company: string;
    date: string;
    description: string;
}

export interface Project {
    name: string;
    date: string;
    description: string;
}

export interface Education {
    degree: string;
    institution: string;
    date: string;
    description: string;
}

export interface SkillCategory {
    category: string;
    items: string;
}

export interface Certification {
    name: string;
    issuer: string;
    date: string;
}

export interface CVData {
    name: string;
    jobTitle: string;
    email: string;
    phone: string;
    domicile: string;
    links: CustomLink[];
    summary: string;
    experience: Experience[];
    projects: Project[];
    education: Education[];
    skills: SkillCategory[];
    certifications: Certification[];
}

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
