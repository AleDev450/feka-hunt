'use client';

import { useEffect, useRef, useState } from 'react';
import { arcadeFont } from '@/app/fonts';
import { GameBridge } from '@/game/bridge/GameBridge';
import type { GameHandle } from '@/game/createGame';
import { createScoreRepository } from '@/services/scores';
import type { GameResult } from '@/types/game';

interface GameCanvasProps {
  onGameOver?: (result: GameResult) => void;
}

/**
 * Monta el juego Phaser solo en el cliente. Phaser se importa dinámicamente
 * dentro del efecto, así nunca se evalúa durante el SSR.
 * La comunicación con el juego es explícita a través de GameBridge.
 */
export default function GameCanvas({ onGameOver }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onGameOverRef = useRef(onGameOver);
  const [hintDismissed, setHintDismissed] = useState(false);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    let cancelled = false;
    let handle: GameHandle | null = null;
    const bridge = new GameBridge();
    const offGameOver = bridge.on('game:over', (result) => onGameOverRef.current?.(result));

    // Pausar automáticamente si el usuario cambia de pestaña o bloquea el teléfono
    const onVisibility = () => {
      if (document.hidden) bridge.emit('control:pause');
    };
    document.addEventListener('visibilitychange', onVisibility);

    void import('@/game/createGame').then(({ createGame }) => {
      if (cancelled || !containerRef.current) return;
      handle = createGame({
        parent: containerRef.current,
        bridge,
        scores: createScoreRepository(),
        fontFamily: arcadeFont.style.fontFamily,
      });
    });

    return () => {
      cancelled = true;
      offGameOver();
      document.removeEventListener('visibilitychange', onVisibility);
      handle?.destroy();
      bridge.clear();
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="game-canvas" />
      {!hintDismissed && (
        <div className="rotate-hint" role="status">
          <span>GIRA TU TELEFONO PARA JUGAR MEJOR ↻</span>
          <button type="button" onClick={() => setHintDismissed(true)}>
            OK
          </button>
        </div>
      )}
    </>
  );
}
