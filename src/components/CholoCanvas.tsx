'use client';

import { useEffect, useRef, useState } from 'react';

export default function CholoCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let handle: { destroy(): void } | undefined;
    void import('@/cholov2/createCholoGame').then(({ createCholoGame }) => {
      if (!cancelled && containerRef.current) handle = createCholoGame(containerRef.current);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; handle?.destroy(); };
  }, []);
  return <>
    <div ref={containerRef} className="game-canvas cholo-canvas" aria-label="Cholo Factos: Lima Racing" />
    {error && <div className="cholo-load-error" role="alert">No se pudo iniciar el juego. <button onClick={() => window.location.reload()}>Reintentar</button></div>}
    <p className="cholo-rotate-hint">Gira el celular para ver mejor la carretera y los controles.</p>
  </>;
}
