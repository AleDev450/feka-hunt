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
const FRIENDS_SOURCE = join(ROOT, 'imgs', 'grupo_amigos_3.png');
const FRIENDS_TILE = [54, 53, 71];
const GIRL_SOURCE = join(ROOT, 'imgs', 'mujer.png');
const HUNTER_SOURCE = join(ROOT, 'imgs', 'nuevo_personaje.png');
const HUT_SOURCE = join(ROOT, 'imgs', 'choza_para_background.png');
const VULTURES_SOURCE = join(ROOT, 'imgs', 'gallinazos.png');
const JACINTO_SOURCE = join(ROOT, 'imgs', 'pequeno_jancito.png');
const KICK_SOURCE = join(ROOT, 'imgs', 'kick.png');
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
    key: 'ronchas',
    source: 'ronchas',
    scale: 0.4,
    anchor: 'bottom',
    components: false,
    frames: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [
      `dance${i + 1}`, [(i % 4) * 384, Math.floor(i / 4) * 512, 384, 512],
    ])),
  },
  {
    key: 'hunter',
    source: 'hunter',
    scale: 0.7,
    anchor: 'bottom',
    holes: true,
    frames: {
      idle: [252, 144, 171, 216],
      idle2: [462, 145, 170, 215],
      walk1: [703, 147, 151, 213],
      walk2: [885, 149, 164, 211],
      walk3: [1070, 149, 159, 211],
      walk4: [1265, 146, 157, 214],
      aim: [51, 482, 230, 219],
      shoot: [329, 483, 235, 218],
      recoil: [672, 486, 197, 215],
      reload: [957, 479, 196, 222],
      reload2: [1220, 478, 193, 223],
      hurt: [88, 814, 156, 224],
      crouch: [509, 850, 234, 188],
      jump: [1051, 728, 211, 306],
    },
  },
  {
    // 6 tipos de gallinazo (ya miran a la derecha, como los espera el juego)
    key: 'vulture',
    source: 'vultures',
    scale: 0.8,
    minSpeck: 90,
    dropIntruders: true,
    components: false,
    anchor: 'center',
    detectHead: true,
    holes: true,
    frames: {
      clasico_fly1: [204, 108, 169, 128],
      clasico_fly2: [366, 108, 148, 128],
      clasico_fly3: [526, 116, 161, 120],
      clasico_fly4: [680, 118, 151, 118],
      clasico_fall: [863, 102, 176, 134],
      clasico_dead: [1057, 169, 169, 67],
      narizon_fly1: [209, 250, 164, 128],
      narizon_fly2: [365, 251, 166, 127],
      narizon_fly3: [523, 256, 164, 122],
      narizon_fly4: [679, 259, 179, 119],
      narizon_fall: [871, 255, 178, 123],
      narizon_dead: [1059, 315, 194, 63],
      serio_fly1: [204, 389, 162, 125],
      serio_fly2: [374, 388, 155, 126],
      serio_fly3: [529, 395, 158, 119],
      serio_fly4: [679, 395, 168, 119],
      serio_fall: [864, 395, 176, 119],
      serio_dead: [1060, 451, 184, 63],
      esport_fly1: [211, 524, 157, 126],
      esport_fly2: [376, 524, 155, 126],
      esport_fly3: [523, 530, 164, 120],
      esport_fly4: [679, 544, 178, 106],
      esport_fall: [864, 528, 182, 122],
      esport_dead: [1058, 587, 193, 63],
      mohicano_fly1: [209, 658, 153, 121],
      mohicano_fly2: [376, 662, 150, 117],
      mohicano_fly3: [531, 668, 154, 111],
      mohicano_fly4: [686, 667, 166, 112],
      mohicano_fall: [865, 662, 174, 117],
      mohicano_dead: [1057, 716, 184, 63],
      tranquilo_fly1: [206, 790, 160, 124],
      tranquilo_fly2: [376, 787, 154, 128],
      tranquilo_fly3: [523, 792, 164, 123],
      tranquilo_fly4: [679, 798, 173, 118],
      tranquilo_fall: [865, 790, 181, 127],
      tranquilo_dead: [1062, 849, 189, 68],
    },
  },
  // --- Pequeño Jacinto (imgs/pequeno_jancito.png): mascota del cazador ---
  {
    key: 'jacinto',
    source: 'jacinto',
    scale: 0.42,
    anchor: 'bottom',
    components: false,
    frames: {
      idle1: [48, 32, 188, 254],
      idle2: [349, 35, 187, 252],
      idle3: [632, 35, 199, 253],
      idle4: [941, 35, 194, 253],
      idle5: [1235, 32, 196, 256],
      idle6: [1533, 32, 196, 253],
      run1: [44, 334, 210, 226],
      run2: [329, 332, 212, 228],
      run3: [626, 332, 205, 234],
      run4: [925, 331, 211, 235],
      run5: [1226, 339, 211, 228],
      run6: [1532, 331, 220, 229],
      hit1: [49, 604, 197, 241],
      hit2: [336, 596, 197, 249],
      hit3: [618, 596, 230, 249],
      hit4: [899, 687, 265, 158],
      hit5: [1224, 653, 243, 190],
      hit6: [1523, 597, 202, 248],
    },
  },
  // --- Grupo de apoyo (imgs/grupo_amigos_3.png): el grupo entero en 8 poses ---
  {
    key: 'friends',
    source: 'friends',
    scale: 0.6,
    anchor: 'bottom',
    components: false,
    frames: {
      cheer1: [23, 409, 410, 136],
      cheer2: [463, 399, 417, 146],
      cheer3: [903, 371, 414, 174],
      cheer4: [1344, 395, 407, 150],
      sad1: [7, 684, 436, 159],
      sad2: [456, 693, 414, 150],
      sad3: [898, 727, 418, 117],
      sad4: [1337, 701, 416, 142],
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
  // Logo del autor (imgs/kick.png)
  { key: 'kickLogo', source: 'kick', rect: [0, 0, 1254, 1254], scale: 0.1, components: false, outline: false },
  { key: 'vulturePerched', source: 'vultures', rect: [1269, 101, 109, 138], scale: 0.85, components: false },
  { key: 'vultureHead', rect: [1299, 331, 181, 143], scale: 0.6 },
  { key: 'portrait', source: 'hunter', rect: [34, 103, 164, 159], scale: 0.34, components: false, outline: false },
  // Choza del fondo (imgs/choza_para_background.png)
  { key: 'hut', source: 'hut', rect: [10, 228, 548, 657], scale: 0.5, components: false, keyAllDark: true, minSpeck: 40 },
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
  // Mismas convenciones que la hoja principal (fondo negro)
  hunter: {
    file: HUNTER_SOURCE,
    bg: (r, g, b) => Math.max(r, g, b) <= BLACK_THRESHOLD,
    fg: (r, g, b) => Math.max(r, g, b) > FG_THRESHOLD,
    hole: (r, g, b) => Math.max(r, g, b) <= 6,
  },
  vultures: {
    file: VULTURES_SOURCE,
    bg: (r, g, b) => Math.max(r, g, b) <= BLACK_THRESHOLD,
    fg: (r, g, b) => Math.max(r, g, b) > 26,
    hole: (r, g, b) => Math.max(r, g, b) <= 8,
  },
  hut: {
    file: HUT_SOURCE,
    // La choza es una estructura abierta: el fondo negro se ve por dentro,
    // así que se quita el negro en toda la imagen (keyAllDark), con un umbral
    // algo más alto para el halo de compresión.
    bg: (r, g, b) => Math.max(r, g, b) <= 34,
    fg: (r, g, b) => Math.max(r, g, b) > FG_THRESHOLD,
    hole: (r, g, b) => Math.max(r, g, b) <= 6,
  },
  girl: {
    file: GIRL_SOURCE,
    bg: (r, g, b) => Math.max(r, g, b) <= BLACK_THRESHOLD,
    fg: (r, g, b) => Math.max(r, g, b) > FG_THRESHOLD,
    hole: (r, g, b) => Math.max(r, g, b) <= 6,
  },
  // PNG con transparencia: el fondo ya viene en el canal alfa
  kick: {
    file: KICK_SOURCE,
    useAlpha: true,
    bg: () => false,
    fg: () => true,
    hole: () => false,
  },
  jacinto: {
    file: JACINTO_SOURCE,
    useAlpha: true,
    bg: () => false,
    fg: () => true,
    hole: () => false,
  },
  ronchas: {
    file: join(ROOT, 'imgs', 'ronchas.png'),
    useAlpha: true,
    bg: () => false,
    fg: () => true,
    hole: () => false,
  },
  friends: {
    file: FRIENDS_SOURCE,
    useAlpha: true,
    bg: () => false,
    fg: () => true,
    hole: () => false,
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
    const opaque = current.useAlpha === true ? SD[i * 4 + 3] >= 20 : true;
    if (opaque && current.fg(SD[i * 4], SD[i * 4 + 1], SD[i * 4 + 2])) fg[i] = 1;
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
  const byAlpha = current.useAlpha === true;
  const isBg = (i) => {
    // Hojas con transparencia: el fondo es simplemente lo transparente
    if (byAlpha) return data[i * 4 + 3] < 20;
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
  if (opts.dropIntruders) removeEdgeIntruders({ w: rw, h: rh, data });
  return trim({ w: rw, h: rh, data });
}

/**
 * Quita trozos del sprite vecino: grupos pegados al borde izquierdo o derecho
 * del recorte que son mucho más pequeños que la figura principal (las celdas
 * de algunas hojas se solapan entre sí).
 */
function removeEdgeIntruders(img) {
  const { w, h, data } = img;
  const groups = opaqueGroups(img);
  if (groups.length < 2) return;
  const biggest = Math.max(...groups.map((g) => g.pixels.length));
  for (const group of groups) {
    const touchesSide = group.pixels.some((i) => i % w === 0 || i % w === w - 1);
    if (touchesSide && group.pixels.length < biggest * 0.25) {
      for (const i of group.pixels) data[i * 4 + 3] = 0;
    }
  }
  void h;
}

/** Grupos de píxeles opacos conectados (4-vecinos). */
function opaqueGroups(img) {
  const { w, h, data } = img;
  const seen = new Uint8Array(w * h);
  const groups = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || data[i * 4 + 3] === 0) continue;
    const pixels = [];
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop();
      pixels.push(j);
      const x = j % w;
      const y = (j / w) | 0;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx;
        if (!seen[k] && data[k * 4 + 3] !== 0) { seen[k] = 1; stack.push(k); }
      }
    }
    groups.push({ pixels });
  }
  return groups;
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

/** Espeja la imagen horizontalmente. */
function flop(img) {
  const data = Buffer.alloc(img.w * img.h * 4);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const src = (y * img.w + x) * 4;
      img.data.copy(data, (y * img.w + (img.w - 1 - x)) * 4, src, src + 4);
    }
  }
  return { w: img.w, h: img.h, data };
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

/**
 * Centro de la cabeza del gallinazo (para los headshots). Busca píxeles de
 * piel/rojo (cara, pico y cuello) y se queda con el grupo más adelantado:
 * los sprites miran a la derecha, así que la cabeza es lo más a la derecha.
 */
function findHead(img) {
  const matches = [];
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const i = (y * img.w + x) * 4;
      const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
      if (img.data[i + 3] && r > 140 && r - b > 45 && g < r - 25) matches.push({ x, y });
    }
  }
  if (matches.length <= 8) return null;
  const minX = Math.min(...matches.map((m) => m.x));
  const maxX = Math.max(...matches.map((m) => m.x));
  const front = matches.filter((m) => m.x >= maxX - (maxX - minX) * 0.45);
  const sum = front.reduce((acc, m) => ({ x: acc.x + m.x, y: acc.y + m.y }), { x: 0, y: 0 });
  return { x: sum.x / front.length, y: sum.y / front.length };
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
    if (sheet.flop) img = flop(img);
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
  if (def.flop) img = flop(img);
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
