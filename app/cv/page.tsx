import type { Metadata } from 'next';
import { CvViewer } from '@/components/cv/CvViewer';

export const metadata: Metadata = {
  title: 'CV',
  description: 'View and print a shared CV.',
};

export default function CVPage() {
  return <CvViewer />;
}
