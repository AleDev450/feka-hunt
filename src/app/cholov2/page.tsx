import type { Metadata } from 'next';
import CholoCanvas from '@/components/CholoCanvas';

export const metadata: Metadata = { title: 'Jugar · Cholo Factos: Lima Racing' };

export default function CholoPage() {
  return <main className="play"><CholoCanvas /></main>;
}
