/**
 * Configuración central del juego.
 * Todos los valores de balance (puntos, vidas, munición, tiempos, dificultad)
 * se ajustan aquí; el resto del código no debe tener números mágicos de gameplay.
 */

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const WORLD = {
  /** Línea del horizonte (base de las montañas) */
  horizonY: 505,
  /** Borde superior del pasto delantero: los gallinazos se esconden detrás */
  grassTopY: 606,
  /** Donde aterriza un gallinazo abatido */
  landingY: 640,
  /** Zona en la que vuelan los gallinazos (bajo el HUD superior) */
  flyArea: { left: 40, right: GAME_WIDTH - 40, top: 110, bottom: 500 },
  /** Punto de aparición desde abajo (detrás del pasto) */
  riseY: 640,
  hunter: { x: 150, y: 710 },
  dog: { homeX: 1150, y: 706, minX: 300, maxX: 1200 },
} as const;

/** Grupo de amigos que anima al fondo (detrás de la laguna) — imgs/grupo_amigos_2.jpg */
export const FRIENDS = {
  x: 640,
  /** Pies del grupo (sobre el campo, al fondo) */
  y: 550,
  spacing: 46,
  cheerMs: 1400,
  sadMs: 1800,
  /** Tristeza corta al fallar un disparo (sin mensaje) */
  missMs: 700,
  frameMs: 170,
  /** Al abatir un gallinazo */
  cheerPhrases: ['¡GORDO, TENEMOS HAMBRE!', '¡VAMOS GORDO!', '¡TÚ PUEDES GORDO!', '¡MÁTALO GORDO, A LA CABEZA!'],
  /** Cuando se le escapa uno */
  sadPhrases: ['¡ADEOFF!', '¡NO GORDOO, LA COMIDA SE VA!', '¡VAMOS AL HAREM NOMÁS!'],
} as const;

export const PLAYER = {
  lives: 3,
  maxLives: 5,
  /** Cartuchos máximos visibles en el HUD */
  magazineSize: 6,
  /** Vida extra cada X puntos */
  extraLifeEvery: 10000,
} as const;

export const SCORING = {
  hit: 100,
  headshot: 250,
  /** Bonus por cada gallinazo adicional abatido con el mismo disparo */
  multiHitBonus: 150,
  /** Bonus por nivel sin dejar escapar a ninguno */
  perfectLevelBonus: 1000,
  combo: {
    /** Aciertos consecutivos necesarios para subir el multiplicador */
    hitsPerStep: 3,
    maxMultiplier: 5,
  },
  livesLostPerEscape: 1,
} as const;

/** Soundtrack de la partida: suena en bucle mientras se juega. */
export const SOUNDTRACK = {
  src: '/assets/audio/soundtrack.mp3',
  /** Volumen bajo para que los efectos (disparos, sirena...) se sigan oyendo */
  volume: 0.45,
} as const;

/** Condición de victoria: superar este nivel. Al terminar (gane o pierda) llega SERFOR. */
export const VICTORY = {
  levels: 50,
} as const;

/**
 * Escena entre niveles: la chica sale del perro, camina hacia el cazador y
 * vuelve. Dura exactamente lo que dura el audio (se leen fracciones de él).
 */
export const LOVE = {
  src: '/assets/audio/teamogordo.mp3',
  /** Duración de referencia del audio si el navegador aún no la conoce */
  durationMs: 4080,
  text: 'Chi amu gordo',
  /** Dónde se detiene respecto al cazador */
  stopOffsetX: 105,
  /** Reparto del tiempo del audio (fracciones acumuladas) */
  timeline: { appear: 0.08, arrive: 0.42, leave: 0.6, back: 0.92 },
  volume: 1,
} as const;

/** Créditos (autor del juego y música) */
export const CREDITS = {
  author: 'KICK/NARUTOMAKI',
  artist: 'PIURANO27',
  videoUrl: 'https://www.youtube.com/watch?v=7fsMy1FpgsI',
} as const;

/** Final (gane o pierda): llega SERFOR por cazar gallinazos */
export const RAID = {
  bannerMs: 1400,
  truckStopX: 1010,
  truckDriveMs: 1300,
  agentRunMs: 900,
  /** Posiciones donde se detienen los agentes (relativas al cazador) */
  maleOffsetX: 190,
  femaleOffsetX: 320,
  speechMs: 3800,
  /** Chica llorando y luego capturada (tiempos desde que llegan los agentes) */
  girlX: 640,
  girlCryFrameMs: 330,
  girlCapturedAtMs: 1900,
  lightBlinkMs: 220,
} as const;

export const INPUT = {
  /** Tolerancia (px lógicos) alrededor del hitbox al apuntar con mouse */
  aimToleranceMouse: 6,
  /** En pantallas táctiles el dedo tapa la mira: más tolerancia */
  aimToleranceTouch: 20,
  /** Radio de la cabeza para headshot */
  headRadius: 14,
  headRadiusTouch: 18,
  shotCooldownMs: 260,
} as const;

export const TIMING = {
  hitFreezeMs: 280,
  fallGravity: 1500,
  deadVisibleMs: 700,
  reloadMs: 650,
  flightGapMs: 650,
  levelBannerMs: 1700,
  staggerSpawnMs: 450,
  /** Tras quedarse sin balas, cuánto esperar antes de que huyan */
  outOfAmmoFleeDelayMs: 350,
  touchCrosshairVisibleMs: 800,
} as const;

/**
 * Parámetros de dificultad. DifficultySystem interpola a partir de estos
 * valores; ningún otro archivo debe decidir velocidades o tiempos por nivel.
 * Las rampas están calculadas para que TODO siga endureciéndose hasta el
 * nivel 50 (los topes se alcanzan justo en el último nivel).
 */
export const DIFFICULTY = {
  vulturesPerLevel: 8,
  /** Nivel 1: 150 px/s → nivel 50: ~520 px/s */
  speed: { base: 150, perLevel: 7.6, max: 520, jitter: 0.15 },
  /** Nivel 1: 7 s para disparar → nivel 50: 2.6 s */
  flyTimeMs: { base: 7000, perLevel: -90, min: 2600 },
  /** Frecuencia del aleteo (fps de la animación) */
  flapFps: { base: 9, perLevel: 0.18, max: 18 },
  /** A partir de qué nivel vuelan N gallinazos a la vez */
  simultaneous: [
    { fromLevel: 1, count: 1 },
    { fromLevel: 3, count: 2 },
    { fromLevel: 12, count: 3 },
    { fromLevel: 30, count: 4 },
  ],
  /** Disparos por tanda = base + extra por gallinazo adicional (tope: magazineSize) */
  shots: { base: 3, perExtraVulture: 1 },
  /** Trayectorias disponibles; las fáciles dejan de salir en niveles altos */
  patterns: [
    { fromLevel: 1, toLevel: 20, pattern: 'straight' },
    { fromLevel: 2, toLevel: 38, pattern: 'wave' },
    { fromLevel: 3, pattern: 'zigzag' },
    { fromLevel: 5, pattern: 'swoop' },
  ],
  spawnSides: [
    { fromLevel: 1, side: 'bottom' },
    { fromLevel: 3, side: 'left' },
    { fromLevel: 3, side: 'right' },
  ],
  /** Cada cuánto cambia de dirección (zigzag): nivel 50 → 420 ms */
  turnIntervalMs: { base: 1400, perLevel: -20, min: 420 },
  waveAmplitude: { base: 40, perLevel: 1.8, max: 130 },
} as const;

export type FlightPattern = (typeof DIFFICULTY.patterns)[number]['pattern'];
export type SpawnSide = (typeof DIFFICULTY.spawnSides)[number]['side'];

export const DEPTH = {
  sky: 0,
  clouds: 1,
  mountains: 2,
  friends: 2.5,
  midground: 3,
  vultures: 10,
  foreground: 20,
  bushes: 21,
  dog: 25,
  hunter: 26,
  fx: 30,
  hud: 50,
  banner: 60,
  crosshair: 100,
} as const;

export const COLORS = {
  gold: 0xf5a623,
  goldText: '#ffb238',
  red: 0xe8412c,
  redText: '#ff4b32',
  blue: 0x2a7de1,
  blueText: '#4aa3ff',
  white: '#ffffff',
  grey: '#b8b8c8',
  green: 0x3fbf3f,
  panel: 0x0b0b14,
  shadow: '#1a0f1a',
  skyTop: 0x2f6fd6,
  skyBottom: 0x8fd0ff,
  field: 0x4f9a2c,
} as const;

export const STORAGE_KEYS = {
  record: 'gallinazo-hunt:record',
  muted: 'gallinazo-hunt:muted',
  playerName: 'gallinazo-hunt:player-name',
} as const;

export const FALLBACK_FONT = '"Press Start 2P", "Courier New", monospace';
