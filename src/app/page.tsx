import Link from 'next/link';
import { CREDITS } from '@/game/config/settings';

export default function HomePage() {
  return (
    <main className="landing">
      <img className="landing__logo" src="/assets/sprites/logo.png" alt="Gallinazo Hunt" width={438} height={168} />
      <p className="landing__tagline">
        UN ARCADE PERUANO DE GALLINAZOS.
        <br />
        APUNTA, DISPARA Y CONSIGUE EL RECORD.
      </p>
      <Link className="landing__cta" href="/jugar">
        ▶ JUGAR
      </Link>
      <div className="landing__cast" aria-hidden>
        <img src="/assets/sprites/vulturePerched.png" alt="" width={99} height={177} />
      </div>
      <p className="landing__credits">
        SOUNDTRACK: {CREDITS.artist} ·{' '}
        <a href={CREDITS.videoUrl} target="_blank" rel="noopener noreferrer">
          VER VIDEO EN YOUTUBE
        </a>
      </p>
      <p className="landing__footer">
        MOUSE O TOUCH · PC · TABLET · MOVIL
        <br />
        JUEGO CREADO POR {CREDITS.author}
      </p>
    </main>
  );
}
