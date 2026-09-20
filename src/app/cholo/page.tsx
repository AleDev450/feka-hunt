import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Cholo Factos: Lima Racing' };

export default function CholoPage() {
  return (
    <main className="cholo-home">
      <div className="cholo-home__panel">
        <p className="cholo-home__eyebrow">FEKA GAMES · PRÓXIMAMENTE</p>
        <h1>CHOLO FACTOS</h1>
        <h2>LIMA RACING</h2>
        <p>Un arcade de carreras limeño lleno de tráfico, maniobras y factos.</p>
        <span className="cholo-home__status">EN DESARROLLO</span>
        <Link className="cholo-home__back" href="/">VOLVER A FEKA GAMES</Link>
      </div>
    </main>
  );
}
