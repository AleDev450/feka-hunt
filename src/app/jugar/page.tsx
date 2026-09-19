import type { Metadata } from 'next';
import GameCanvas from '@/components/GameCanvas';

export const metadata: Metadata = {
  title: 'Jugar · Gallinazo Hunt',
};

export default function PlayPage() {
  return (
    <main className="play">
      <GameCanvas />
    </main>
  );
}
