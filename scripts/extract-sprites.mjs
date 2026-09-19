/**
 * Extrae los sprites del spritesheet de referencia (imgs/*.png) y genera:
 *  - PNGs listos para Phaser en public/assets/sprites
 *  - src/game/config/assetManifest.ts con tamaños de frame, hitboxes y cabezas
 *
 * El spritesheet de referencia no tiene una grilla uniforme: cada sprite se
 * localiza por rectángulo, se le quita el fondo (negro o cielo azul) con un
 * flood-fill desde el borde, se recorta y se empaqueta en tiras de frames de
 * tamaño uniforme para poder usar `generateFrameNumbers`.
 *
 * Uso: npm run sprites
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'imgs', '59348bb2-9d4c-4797-91ad-8a2ce90b9241.png');
const SERFOR_SOURCE = join(ROOT, 'imgs', 'serfor.png');
const FRIENDS_SOURCE = join(ROOT, 'imgs', 'grupo_amigos_2.jpg');
const FRIENDS_TILE = [54, 53, 71];
const GIRL_SOURCE = join(ROOT, 'imgs', 'mujer.png');
const OUT_DIR = join(ROOT, 'public', 'assets', 'sprites');
const MANIFEST = join(ROOT, 'src', 'game', 'config', 'assetManifest.ts');

const BLACK_THRESHOLD = 12; // max(r,g,b) <= esto se considera fondo negro
const FG_THRESHOLD = 18; // para etiquetar componentes conectados
const OUTLINE = [22, 12, 24]; // contorno oscuro para dar contraste sobre el cielo

// ---------------------------------------------------------------------------
// Definición de sprites: [x, y, w, h] en el spritesheet original
// ---------------------------------------------------------------------------

/** Tiras de animación (spritesheets uniformes) */
const SHEETS = [
  {
    key: 'hunter',
    scale: 1,
    anchor: 'bottom',
    frames: {
      idle: [496, 62, 106, 166],
      aim: [616, 86, 149, 142],
      shoot: [763, 86, 159, 142],
      recoil: [924, 80, 102, 148],
      reload: [1043, 86, 98, 142],
      hurt: [1158, 112, 89, 116],
      crouch: [1276, 128, 90, 99],
      jump: [1379, 62, 119, 157],
    },
  },
  {
    key: 'vulture',
    scale: 0.66,
    anchor: 'center',
    detectHead: true,
    frames: {
      fly1: [46, 283, 152, 166],
      fly2: [214, 277, 151, 172],
      fly3: [363, 292, 154, 165],
      fly4: [511, 304, 160, 156],
      fall: [704, 308, 162, 155],
      dead: [914, 395, 179, 74],
    },
  },
  {
    key: 'dog',
    scale: 0.9,
    holes: true,
    anchor: 'bottom',
    frames: {
      idle: [27, 587, 126, 121],
      run: [166, 598, 147, 111],
      bark: [305, 588, 151, 120],
      sit: [442, 588, 106, 121],
      excited: [566, 543, 115, 163],
    },
  },
  // --- Grupo de apoyo (imgs/grupo_amigos_2.jpg): 4 poses animando + 3 tristes por amigo ---
  // (la 4ª columna "triste" de algunas filas es otro personaje, por eso solo 3)
  {
    key: 'friends',
    source: 'friends',
    scale: 0.56,
    anchor: 'bottom',
    components: false,
    holes: true,
    frames: {
      mascara_cheer1: [26, 110, 111, 110],
      mascara_cheer2: [154, 110, 130, 110],
      mascara_cheer3: [303, 110, 128, 110],
      mascara_cheer4: [450, 110, 119, 110],
      mascara_sad1: [754, 110, 108, 110],
      mascara_sad2: [879, 110, 108, 110],
      mascara_sad3: [1003, 110, 108, 110],
      mochila_cheer1: [26, 237, 111, 109],
      mochila_cheer2: [154, 237, 130, 109],
      mochila_cheer3: [303, 237, 128, 109],
      mochila_cheer4: [450, 237, 119, 109],
      mochila_sad1: [754, 237, 108, 109],
      mochila_sad2: [879, 237, 108, 109],
      mochila_sad3: [1003, 237, 108, 109],
      chaqueta_cheer1: [26, 362, 111, 107],
      chaqueta_cheer2: [154, 362, 130, 107],
      chaqueta_cheer3: [303, 362, 128, 107],
      chaqueta_cheer4: [450, 362, 119, 107],
      chaqueta_sad1: [754, 362, 108, 107],
      chaqueta_sad2: [879, 362, 108, 107],
      chaqueta_sad3: [1003, 362, 108, 107],
      pelolargo_cheer1: [26, 486, 111, 101],
      pelolargo_cheer2: [154, 486, 130, 101],
      pelolargo_cheer3: [303, 486, 128, 101],
      pelolargo_cheer4: [450, 486, 119, 101],
      pelolargo_sad1: [754, 486, 108, 101],
      pelolargo_sad2: [879, 486, 108, 101],
      pelolargo_sad3: [1003, 486, 108, 101],
      barbudo_cheer1: [26, 604, 111, 101],
      barbudo_cheer2: [154, 604, 130, 101],
      barbudo_cheer3: [303, 604, 128, 101],
      barbudo_cheer4: [450, 604, 119, 101],
      barbudo_sad1: [754, 604, 108, 101],
      barbudo_sad2: [879, 604, 108, 101],
      barbudo_sad3: [1003, 604, 108, 101],
      auriculares_cheer1: [26, 721, 111, 101],
      auriculares_cheer2: [154, 721, 130, 101],
      auriculares_cheer3: [303, 721, 128, 101],
      auriculares_cheer4: [450, 721, 119, 101],
      auriculares_sad1: [754, 721, 108, 101],
      auriculares_sad2: [879, 721, 108, 101],
      auriculares_sad3: [1003, 721, 108, 101],
    },
  },
  // --- Chica (imgs/mujer.png): caminata + llanto ---
  {
    key: 'girl',
    source: 'girl',
    scale: 0.95,
    anchor: 'bottom',
    holes: true,
    frames: {
      walk1: [19, 58, 63, 141],
      walk2: [111, 58, 62, 141],
      walk3: [204, 58, 61, 142],
      walk4: [293, 58, 58, 142],
      walk5: [381, 58, 63, 141],
      surprised: [476, 58, 62, 141],
      tears: [549, 58, 59, 141],
      cover1: [623, 65, 53, 134],
      cover2: [693, 71, 56, 128],
      kneel: [765, 88, 63, 110],
    },
  },
  // --- SERFOR (imgs/serfor.png) ---
  {
    key: 'agentMale',
    source: 'serfor',
    scale: 0.95,
    holes: true,
    anchor: 'bottom',
    frames: {
      idle: [477, 52, 73, 164],
      walk: [567, 57, 84, 159],
      run: [660, 64, 95, 145],
      aim: [765, 66, 130, 150],
      shoot: [896, 67, 133, 149],
      reload: [1033, 66, 99, 150],
      hurt: [1142, 110, 88, 106],
      crouch: [1258, 113, 92, 103],
      jump: [1394, 35, 100, 168],
    },
  },
  {
    key: 'agentFemale',
    source: 'serfor',
    scale: 0.95,
    holes: true,
    anchor: 'bottom',
    frames: {
      idle: [26, 281, 67, 157],
      walk: [111, 281, 82, 156],
      run: [210, 283, 87, 154],
      aim: [313, 284, 122, 153],
      shoot: [422, 284, 122, 153],
      reload: [542, 298, 86, 138],
      hurt: [653, 316, 76, 120],
      crouch: [753, 337, 84, 99],
      jump: [870, 285, 78, 151],
    },
  },
];

/** Imágenes sueltas */
const IMAGES = [
  { key: 'logo', rect: [25, 28, 448, 178], scale: 1, outline: false },
  { key: 'vulturePerched', rect: [1133, 292, 118, 182], scale: 0.9, components: false },
  { key: 'vultureHead', rect: [1299, 331, 181, 143], scale: 0.6 },
  { key: 'portrait', rect: [42, 806, 94, 86], scale: 0.7, components: false, outline: false },
  { key: 'iconVulture', rect: [321, 915, 47, 46], scale: 0.85 },
  { key: 'iconVultureEmpty', rect: [455, 914, 45, 48], scale: 0.85, outline: false, keyAllDark: true },
  { key: 'shotgun', rect: [589, 828, 140, 91], scale: 0.6 },
  { key: 'shell', rect: [750, 836, 64, 68], scale: 0.45 },
  { key: 'feather', rect: [845, 840, 55, 68], scale: 0.35 },
  { key: 'crosshair', rect: [916, 836, 81, 81], scale: 0.9, keyAllDark: true },
  { key: 'vultureDown', rect: [1022, 833, 74, 82], scale: 0.6, minSpeck: 60 },
  // Escenario
  { key: 'tree', rect: [1127, 561, 112, 168], scale: 1.6, bg: 'sky', components: false },
  { key: 'bush', rect: [1248, 637, 120, 105], scale: 1 },
  { key: 'lake', rect: [1382, 655, 126, 84], scale: 1, components: false },
  { key: 'grassBlock', rect: [1144, 836, 99, 68], scale: 1 },
  { key: 'grassTuft', rect: [1275, 840, 48, 58], scale: 1 },
  { key: 'fence', rect: [1342, 894, 116, 79], scale: 0.9 },
  { key: 'sign', rect: [1462, 895, 51, 78], scale: 0.9 },
  { key: 'crate', rect: [1242, 911, 71, 70], scale: 0.8 },
  { key: 'cloudA', rect: [737, 600, 60, 30], scale: 2, bg: 'sky', components: false, outline: false },
  { key: 'girlCaptured', source: 'girl', rect: [662, 244, 165, 142], scale: 0.95, holes: true },
  // --- SERFOR ---
  { key: 'serforTruck', source: 'serfor', rect: [630, 550, 232, 110], scale: 1.8, holes: true },
  { key: 'serforFace', source: 'serfor', rect: [1335, 289, 84, 75], scale: 1, components: false },
  { key: 'serforLogo', source: 'serfor', rect: [27, 27, 423, 153], scale: 0.6, outline: false },
  { key: 'serforBadge', source: 'serfor', rect: [353, 889, 62, 78], scale: 0.8 },
  { key: 'cloudB', rect: [876, 590, 62, 34], scale: 2, bg: 'sky', components: false, outline: false },
];

/** Tiras horizontales repetibles (se espejan para que empalmen sin costura) */
const STRIPS = [
  { key: 'grassStrip', rect: [956, 648, 160, 88], scale: 1.4, bg: 'sky' },
  { key: 'mountainStrip', rect: [724, 668, 221, 68], scale: 2, bg: 'sky' },
];

// ---------------------------------------------------------------------------
// Utilidades de imagen (buffers RGBA crudos)
// ---------------------------------------------------------------------------

/**
 * Hojas de origen. Cada una define cómo reconocer su color de fondo:
 *  - bg: fondo (se elimina con flood-fill)
 *  - fg: píxel de sprite (para etiquetar componentes)
 *  - hole: fondo "puro" encerrado dentro de un sprite (opción `holes`)
 */
const colorDist = (r, g, b, c) => Math.abs(r - c[0]) + Math.abs(g - c[1]) + Math.abs(b - c[2]);
const SERFOR_BG = [2, 10, 12];
const SOURCES = {
  main: {
    file: SOURCE,
    bg: (r, g, b) => Math.max(r, g, b) <= BLACK_THRESHOLD,
    fg: (r, g, b) => Math.max(r, g, b) > FG_THRESHOLD,
    hole: (r, g, b) => Math.max(r, g, b) <= 6,
  },
  serfor: {
    file: SERFOR_SOURCE,
    bg: (r, g, b) => colorDist(r, g, b, SERFOR_BG) <= 24,
    fg: (r, g, b) => colorDist(r, g, b, SERFOR_BG) > 40,
    hole: (r, g, b) => colorDist(r, g, b, SERFOR_BG) <= 10,
  },
  // Misma convención que la hoja principal: fondo negro
  girl: {
    file: GIRL_SOURCE,
    bg: (r, g, b) => Math.max(r, g, b) <= BLACK_THRESHOLD,
    fg: (r, g, b) => Math.max(r, g, b) > FG_THRESHOLD,
    hole: (r, g, b) => Math.max(r, g, b) <= 6,
  },
  // JPEG: cada sprite está dentro de una "baldosa" gris azulada oscura
  friends: {
    file: FRIENDS_SOURCE,
    bg: (r, g, b) => colorDist(r, g, b, FRIENDS_TILE) <= 30 || Math.max(r, g, b) <= 14,
    fg: (r, g, b) => colorDist(r, g, b, FRIENDS_TILE) > 40,
    hole: (r, g, b) => colorDist(r, g, b, FRIENDS_TILE) <= 16,
  },
};

let SW = 0;
let SH = 0;
let SD = Buffer.alloc(0);
let labels = { lab: new Int32Array(0), boxes: [] };
let current = SOURCES.main;
const loaded = new Map();

/** Selecciona la hoja de origen activa (se carga y etiqueta una sola vez). */
async function useSource(name) {
  if (!loaded.has(name)) {
    const source = SOURCES[name];
    const img = await sharp(source.file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    current = source;
    SW = img.info.width;
    SH = img.info.height;
    SD = img.data;
    loaded.set(name, { source, SW, SH, SD, labels: labelComponents() });
  }
  ({ source: current, SW, SH, SD, labels } = loaded.get(name));
}

function labelComponents() {
  const D = 2;
  const fg = new Uint8Array(SW * SH);
  for (let i = 0; i < SW * SH; i++) {
    if (current.fg(SD[i * 4], SD[i * 4 + 1], SD[i * 4 + 2])) fg[i] = 1;
  }
  const dil = new Uint8Array(SW * SH);
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      if (!fg[y * SW + x]) continue;
      for (let dy = -D; dy <= D; dy++) {
        for (let dx = -D; dx <= D; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < SW && ny < SH) dil[ny * SW + nx] = 1;
        }
      }
    }
  }
  const lab = new Int32Array(SW * SH);
  const boxes = [null];
  let n = 0;
  for (let i = 0; i < SW * SH; i++) {
    if (!dil[i] || lab[i]) continue;
    n++;
    const stack = [i];
    lab[i] = n;
    let x0 = SW, y0 = SH, x1 = 0, y1 = 0;
    while (stack.length) {
      const j = stack.pop();
      const x = j % SW;
      const y = (j / SW) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && dil[j - 1] && !lab[j - 1]) { lab[j - 1] = n; stack.push(j - 1); }
      if (x < SW - 1 && dil[j + 1] && !lab[j + 1]) { lab[j + 1] = n; stack.push(j + 1); }
      if (y > 0 && dil[j - SW] && !lab[j - SW]) { lab[j - SW] = n; stack.push(j - SW); }
      if (y < SH - 1 && dil[j + SW] && !lab[j + SW]) { lab[j + SW] = n; stack.push(j + SW); }
    }
    boxes.push({ x0, y0, x1, y1 });
  }
  return { lab, boxes };
}

/** Recorta un rect del original y elimina el fondo. Devuelve {w,h,data} RGBA. */
function cutout(rect, opts = {}) {
  const [rx, ry, rw, rh] = rect;
  const { bg = 'black', components = true, keyAllDark = false, holes = false, minSpeck = 14 } = opts;
  const data = Buffer.alloc(rw * rh * 4);
  for (let y = 0; y < rh; y++) {
    SD.copy(data, y * rw * 4, ((ry + y) * SW + rx) * 4, ((ry + y) * SW + rx + rw) * 4);
  }

  // Componentes permitidos: los que caen completamente dentro del rect
  let allowed = null;
  if (components) {
    allowed = new Set();
    labels.boxes.forEach((b, id) => {
      if (!b) return;
      if (b.x0 >= rx - 3 && b.y0 >= ry - 3 && b.x1 <= rx + rw + 2 && b.y1 <= ry + rh + 2) allowed.add(id);
    });
  }

  const sky = bg === 'sky' ? [data[0], data[1], data[2]] : null;
  const isBg = (i) => {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    if (current.bg(r, g, b)) return true;
    if (sky) {
      const d = Math.abs(r - sky[0]) + Math.abs(g - sky[1]) + Math.abs(b - sky[2]);
      // cielo: azul dominante y cercano al color muestreado
      if (d < 90 && b > r + 60 && b > g + 20) return true;
    }
    return false;
  };

  const bgMask = new Uint8Array(rw * rh);
  if (keyAllDark) {
    for (let i = 0; i < rw * rh; i++) if (isBg(i)) bgMask[i] = 1;
  } else {
    const stack = [];
    for (let x = 0; x < rw; x++) { stack.push(x, (rh - 1) * rw + x); }
    for (let y = 0; y < rh; y++) { stack.push(y * rw, y * rw + rw - 1); }
    while (stack.length) {
      const i = stack.pop();
      if (bgMask[i] || !isBg(i)) continue;
      bgMask[i] = 1;
      const x = i % rw;
      const y = (i / rw) | 0;
      if (x > 0) stack.push(i - 1);
      if (x < rw - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - rw);
      if (y < rh - 1) stack.push(i + rw);
    }
  }

  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const i = y * rw + x;
      let transparent = bgMask[i] === 1;
      if (!transparent && allowed) {
        const id = labels.lab[(ry + y) * SW + rx + x];
        if (id && !allowed.has(id)) transparent = true;
      }
      data[i * 4 + 3] = transparent ? 0 : 255;
    }
  }
  if (holes) removeHoles({ w: rw, h: rh, data });
  removeSpecks({ w: rw, h: rh, data }, minSpeck);
  return trim({ w: rw, h: rh, data });
}

/** Huecos cerrados de fondo puro (p. ej. entre las patas del perro). */
function removeHoles(img) {
  const { w, h, data } = img;
  const dark = (i) => data[i * 4 + 3] !== 0 && current.hole(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  const seen = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || !dark(i)) continue;
    const group = [];
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop();
      group.push(j);
      const x = j % w;
      const y = (j / w) | 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx;
        if (!seen[k] && dark(k)) { seen[k] = 1; stack.push(k); }
      }
    }
    if (group.length >= 25) for (const j of group) data[j * 4 + 3] = 0;
  }
}

/** Elimina islas opacas diminutas (ruido de compresión). */
function removeSpecks(img, minSize) {
  const { w, h, data } = img;
  const seen = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || data[i * 4 + 3] === 0) continue;
    const group = [];
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop();
      group.push(j);
      const x = j % w;
      const y = (j / w) | 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx;
        if (!seen[k] && data[k * 4 + 3] !== 0) { seen[k] = 1; stack.push(k); }
      }
    }
    if (group.length < minSize) for (const j of group) data[j * 4 + 3] = 0;
  }
}

function opaqueBounds(img) {
  const { w, h, data } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? { x: 0, y: 0, w: 0, h: 0 } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function crop(img, x, y, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row++) {
    img.data.copy(out, row * w * 4, ((y + row) * img.w + x) * 4, ((y + row) * img.w + x + w) * 4);
  }
  return { w, h, data: out };
}

function trim(img) {
  const b = opaqueBounds(img);
  return crop(img, b.x, b.y, b.w, b.h);
}

async function resize(img, scale) {
  if (scale === 1) return img;
  const w = Math.max(1, Math.round(img.w * scale));
  const h = Math.max(1, Math.round(img.h * scale));
  const kernel = scale >= 1 ? 'nearest' : 'lanczos3';
  const data = await sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } })
    .resize(w, h, { kernel })
    .raw()
    .toBuffer();
  // Bordes nítidos: alpha binario, como el pixel art real
  for (let i = 3; i < data.length; i += 4) data[i] = data[i] >= 110 ? 255 : 0;
  return { w, h, data };
}

/** Añade un contorno de 1px (vecindad 4) alrededor de los píxeles opacos. */
function outline(img) {
  const w = img.w + 2;
  const h = img.h + 2;
  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < img.h; y++) {
    img.data.copy(data, ((y + 1) * w + 1) * 4, y * img.w * 4, (y + 1) * img.w * 4);
  }
  const src = Buffer.from(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (src[i + 3] !== 0) continue;
      const near =
        (x > 0 && src[i - 4 + 3]) || (x < w - 1 && src[i + 4 + 3]) ||
        (y > 0 && src[i - w * 4 + 3]) || (y < h - 1 && src[i + w * 4 + 3]);
      if (near) {
        data[i] = OUTLINE[0];
        data[i + 1] = OUTLINE[1];
        data[i + 2] = OUTLINE[2];
        data[i + 3] = 255;
      }
    }
  }
  return { w, h, data };
}

function mirrorConcat(img) {
  const w = img.w * 2;
  const data = Buffer.alloc(w * img.h * 4);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const s = (y * img.w + x) * 4;
      img.data.copy(data, (y * w + x) * 4, s, s + 4);
      img.data.copy(data, (y * w + (w - 1 - x)) * 4, s, s + 4);
    }
  }
  return { w, h: img.h, data };
}

/** Centroide de los píxeles rojizos (cabeza del gallinazo). */
function findHead(img) {
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const i = (y * img.w + x) * 4;
      const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
      if (img.data[i + 3] && r > 120 && r - g > 55 && r - b > 20) { sx += x; sy += y; n++; }
    }
  }
  return n > 8 ? { x: sx / n, y: sy / n } : null;
}

async function save(img, key) {
  const file = `${key}.png`;
  await sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(join(OUT_DIR, file));
  return file;
}

const round = (v) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------------------
// Proceso
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });
const manifest = { sheets: {}, images: {} };

for (const sheet of SHEETS) {
  await useSource(sheet.source ?? 'main');
  const names = Object.keys(sheet.frames);
  const imgs = [];
  for (const name of names) {
    let img = cutout(sheet.frames[name], sheet);
    img = await resize(img, sheet.scale);
    img = outline(img);
    imgs.push(img);
  }
  const fw = Math.max(...imgs.map((i) => i.w)) + 2;
  const fh = Math.max(...imgs.map((i) => i.h)) + 2;
  const out = { w: fw * imgs.length, h: fh, data: Buffer.alloc(fw * imgs.length * fh * 4) };
  const meta = {};
  imgs.forEach((img, idx) => {
    const ox = idx * fw + Math.floor((fw - img.w) / 2);
    const oy = sheet.anchor === 'bottom' ? fh - img.h - 1 : Math.floor((fh - img.h) / 2);
    for (let y = 0; y < img.h; y++) {
      img.data.copy(out.data, ((oy + y) * out.w + ox) * 4, y * img.w * 4, (y + 1) * img.w * 4);
    }
    const lx = ox - idx * fw;
    const entry = { index: idx, body: { x: lx, y: oy, w: img.w, h: img.h } };
    if (sheet.detectHead) {
      const head = findHead(img);
      if (head) entry.head = { x: round(lx + head.x), y: round(oy + head.y) };
    }
    meta[names[idx]] = entry;
  });
  const file = await save(out, sheet.key);
  manifest.sheets[sheet.key] = { file, frameWidth: fw, frameHeight: fh, frames: meta };
  console.log(`sheet ${sheet.key}: ${imgs.length} frames ${fw}x${fh}`);
}

for (const def of IMAGES) {
  await useSource(def.source ?? 'main');
  let img = cutout(def.rect, def);
  img = await resize(img, def.scale ?? 1);
  if (def.outline !== false) img = outline(img);
  const file = await save(img, def.key);
  manifest.images[def.key] = { file, width: img.w, height: img.h };
  console.log(`image ${def.key}: ${img.w}x${img.h}`);
}

for (const def of STRIPS) {
  await useSource(def.source ?? 'main');
  let img = cutout(def.rect, { ...def, components: false });
  // Quitar las columnas del borde del panel para que el espejo no deje costura
  img = crop(img, 3, 0, img.w - 6, img.h);
  img = await resize(img, def.scale ?? 1);
  // Alinear todo al borde inferior para que la tira se apoye en el suelo
  img = mirrorConcat(img);
  const file = await save(img, def.key);
  manifest.images[def.key] = { file, width: img.w, height: img.h };
  console.log(`strip ${def.key}: ${img.w}x${img.h}`);
}

const ts = `// Archivo generado por scripts/extract-sprites.mjs — no editar a mano.
// Regenerar con: npm run sprites

export const ASSET_BASE_PATH = '/assets/sprites/';

export const SPRITE_SHEETS = ${JSON.stringify(manifest.sheets, null, 2)} as const;

export const IMAGES = ${JSON.stringify(manifest.images, null, 2)} as const;

export type SheetKey = keyof typeof SPRITE_SHEETS;
export type ImageKey = keyof typeof IMAGES;
`;
mkdirSync(dirname(MANIFEST), { recursive: true });
writeFileSync(MANIFEST, ts);
console.log(`manifest -> ${MANIFEST}`);
