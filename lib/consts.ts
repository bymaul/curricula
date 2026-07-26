import { Award, Briefcase, FolderGit2, GraduationCap, LucideIcon, User, Wrench } from 'lucide-react';
import { CVData } from './schema';

export const SECTIONS: { name: string; icon: LucideIcon; fields: (keyof CVData)[] }[] = [
    { name: 'Personal', icon: User, fields: ['name', 'jobTitle', 'email', 'phone', 'location', 'links', 'summary'] },
    { name: 'Experience', icon: Briefcase, fields: ['experience'] },
    { name: 'Projects', icon: FolderGit2, fields: ['projects'] },
    { name: 'Education', icon: GraduationCap, fields: ['education'] },
    { name: 'Skills', icon: Wrench, fields: ['skills'] },
    { name: 'Certifications', icon: Award, fields: ['certifications'] },
];
