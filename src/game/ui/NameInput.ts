import type Phaser from 'phaser';
import { COLORS } from '../config/settings';
import { getServices } from '../config/services';

export const MAX_NAME_LENGTH = 12;

/** Mayúsculas, sin tildes (salvo la Ñ), solo letras, números y espacios. */
export function cleanName(raw: string): string {
  return raw
    .toUpperCase()
    .normalize('NFD')
    .replace(/Ñ/g, 'Ñ')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9Ñ ]/g, '')
    .replace(/ {2,}/g, ' ')
    .slice(0, MAX_NAME_LENGTH);
}

/**
 * Campo de texto real (elemento DOM sobre el canvas) para el nombre del
 * ranking. Al ser un <input>, en el móvil abre el teclado del sistema.
 */
export class NameInput {
  readonly element: HTMLInputElement;
  private readonly dom: Phaser.GameObjects.DOMElement;

  constructor(scene: Phaser.Scene, x: number, y: number, initial: string, width = 440) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = MAX_NAME_LENGTH;
    input.value = cleanName(initial);
    input.placeholder = 'TU NOMBRE';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('autocapitalize', 'characters');
    input.setAttribute('aria-label', 'Nombre para el ranking');
    Object.assign(input.style, {
      width: `${width}px`,
      boxSizing: 'border-box',
      padding: '14px 12px',
      fontFamily: getServices(scene).fontFamily,
      fontSize: '26px',
      letterSpacing: '2px',
      textAlign: 'center',
      textTransform: 'uppercase',
      color: '#ffffff',
      background: '#0b0b14',
      border: `4px solid #${COLORS.gold.toString(16)}`,
      borderRadius: '8px',
      outline: 'none',
      caretColor: COLORS.goldText,
    });
    input.addEventListener('input', () => {
      const clean = cleanName(input.value);
      if (clean !== input.value) input.value = clean;
    });
    this.element = input;
    this.dom = scene.add.dom(x, y, input);
  }

  get value(): string {
    return cleanName(this.element.value).trim();
  }

  setDepth(depth: number): this {
    this.dom.setDepth(depth);
    return this;
  }

  setEnabled(enabled: boolean): void {
    this.element.disabled = !enabled;
    this.element.style.opacity = enabled ? '1' : '0.6';
  }

  focus(): void {
    this.element.focus({ preventScroll: true });
  }
}
