import { STORAGE_KEYS } from '../config/settings';

export const padScore = (value: number, digits = 6): string =>
  Math.max(0, Math.floor(value)).toString().padStart(digits, '0');

export const randomRange = (min: number, max: number): number => min + Math.random() * (max - min);

export const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Distancia de un punto a un rectángulo (0 si está dentro). */
export function distanceToRect(px: number, py: number, x: number, y: number, w: number, h: number): number {
  const dx = Math.max(x - px, 0, px - (x + w));
  const dy = Math.max(y - py, 0, py - (y + h));
  return Math.hypot(dx, dy);
}

/** Acceso a localStorage tolerante a errores (modo privado, SSR, etc.). */
export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // sin persistencia disponible
    }
  },
};

export function loadRecord(): number {
  const value = Number(storage.get(STORAGE_KEYS.record));
  return Number.isFinite(value) ? value : 0;
}

export function saveRecord(value: number): void {
  storage.set(STORAGE_KEYS.record, String(Math.floor(value)));
}

/** Dispositivo cuyo puntero principal es el dedo (teléfono/tablet). */
export const isTouchDevice = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
