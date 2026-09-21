import Link from 'next/link';
import { CREDITS } from '@/game/config/settings';

export default function HomePage() {
  return (
    <main className="landing">
      <h1 className="landing__title">LAS AVENTURAS<br />DE LOS FEKAS</h1>
      <p className="landing__tagline">JUEGOS ARCADE PERUANOS.<br />ELIGE TU AVENTURA.</p>
      <section className="adventures" aria-label="Juegos disponibles">
        <Link className="adventure adventure--available" href="/jugar">
          <img src="/assets/sprites/logo.png" alt="Gallinazo Hunt" />
          <span className="adventure__name">GALLINAZO HUNT</span>
          <span className="adventure__action">▶ JUGAR</span>
        </Link>
        <div className="adventure adventure--cholo adventure--disabled" aria-disabled="true">
          <div className="adventure__placeholder">CHOLO<br />FACTOS</div>
          <span className="adventure__name">CHOLO FACTOS: LIMA RACING</span>
          <span className="adventure__action">▶ JUGAR</span>
        </div>
      </section>
      <p className="landing__footer">MOUSE O TOUCH · PC · TABLET · MOVIL</p>
      <div className="landing__author"><span>DESARROLLADO POR</span><img src="/assets/sprites/kickLogo.png" alt={CREDITS.author} width={113} height={95} /></div>
    </main>
  );
}
