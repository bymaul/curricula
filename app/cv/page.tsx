import type { Metadata } from 'next';
import { CvViewer } from '@/components/cv/CvViewer';

export const metadata: Metadata = {
  title: 'Shared CV',
  description: 'View and print a shared CV.',
  robots: { index: false, follow: false },
};

export default function CVPage() {
  return <CvViewer />;
}
