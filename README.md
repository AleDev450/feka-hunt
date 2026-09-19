# Gallinazo Hunt

Arcade retro 16-bit peruano de gallinazos: apunta, dispara y consigue el récord.
Stack: **Next.js 16 + Phaser 4 + TypeScript**, con **Supabase** opcional para el ranking online y deploy en **Vercel**.

## Uso

```bash
npm install
npm run dev        # http://localhost:3000  → /jugar
npm run build      # build de producción
npm run typecheck
npm run sprites    # regenera los sprites desde imgs/ (ver abajo)
```

## Estructura

```text
src/
├── app/                 # Next.js (landing "/" y "/jugar")
├── components/GameCanvas.tsx   # monta Phaser solo en el cliente
├── game/
│   ├── bridge/          # GameBridge: canal explícito React ⇄ Phaser
│   ├── config/          # settings.ts (TODO el balance), gameConfig, animaciones, assetManifest (generado)
│   ├── scenes/          # Boot, Preload, Menu, HowToPlay, Ranking, Game, Pause, GameOver
│   ├── entities/        # Hunter, Vulture, Dog, Crosshair
│   ├── systems/         # SpawnSystem (pool), ScoreSystem, DifficultySystem, AudioSystem
│   ├── ui/              # HUD, botones, textos flotantes, banner, iniciales
│   ├── world/           # Background (escenario)
│   └── utils/
├── services/scores/     # ScoreRepository: Local (localStorage) o Supabase
├── lib/supabase/
└── types/game.ts        # tipos compartidos (GameResult, ScoreEntry…)
supabase/schema.sql      # tablas users, games, game_sessions, scores, events, seasons + vista leaderboards
scripts/extract-sprites.mjs
```

## Sprites

El spritesheet de referencia (`imgs/*.png`) no tiene grilla uniforme. `npm run sprites` recorta cada sprite
por rectángulo, elimina el fondo (negro o cielo), añade contorno, empaqueta las animaciones en tiras de
frames uniformes (`generateFrameNumbers`) y genera `src/game/config/assetManifest.ts` con hitboxes y la
posición de la cabeza del gallinazo (para headshots). Los PNG resultantes están en `public/assets/sprites`.

## Soundtrack y reloj de la partida

La partida suena con `public/assets/audio/soundtrack.mp3` (**música: piurano27** —
[video del gallinazo](https://www.youtube.com/watch?v=7fsMy1FpgsI)). Se reproduce en streaming con un `<audio>`,
en paralelo a los efectos. La canción es el reloj: el HUD muestra el TIEMPO restante y, cuando termina, se acaba la partida.

## Personajes

- **Cazador:** usa un único sprite ("apuntando"); disparo, recarga, daño y celebración son efectos (retroceso, fogonazo, destello rojo, salto).
- **Grupo de amigos** (`imgs/grupo_amigos_2.jpg`, `src/game/entities/FriendsGroup.ts`): al fondo, detrás de la laguna.
  Animan (4 poses) cada gallinazo abatido y se ponen tristes (3 poses) al fallar o cuando uno escapa, con sus frases. Posición, tiempos y frases en `FRIENDS` (settings.ts).

## Entre niveles: "Chi amu gordo"

Al completar un nivel se pausa toda la música y suena `public/assets/audio/teamogordo.mp3`. Mientras dura el audio,
la chica (`imgs/mujer.png`) sale del perro, camina hasta el cazador, aparece "Chi amu gordo" con corazones y
vuelve a meterse en el perro (`src/game/cutscenes/LoveInterlude.ts`, tiempos en `LOVE`). El reloj de la canción
se congela durante la escena. En el final con SERFOR, la chica aparece llorando y termina capturada.

## Final: llega SERFOR

Al terminar la partida — **gana** (llega vivo al final de la canción) o **pierde** (sin vidas) —
suena la sirena, llega la camioneta de SERFOR, bajan dos agentes y detienen al cazador
("¡ALTO! ¡MANOS ARRIBA!"). Luego aparece "¡GANASTE!" o "GAME OVER". Tiempos en `RAID` (settings.ts);
la escena está en `src/game/cutscenes/SerforRaid.ts`. Los sprites salen de `imgs/serfor.png`.

## Balance

Todo está en `src/game/config/settings.ts`: puntos (100 / headshot 250 / combos hasta x5 / nivel perfecto +1000),
vidas, munición, tiempos y la tabla de dificultad que consume `DifficultySystem`
(velocidad, tiempo de vuelo, gallinazos simultáneos, trayectorias `straight / wave / zigzag / swoop`, lados de entrada).

## Sonido

`AudioSystem` sintetiza placeholders con WebAudio (disparo, impacto, caída, escape, recarga, botón, combo,
game over, ladrido y sirena de SERFOR). Para usar archivos reales: copiarlos a `public/assets/audio`
y poner la ruta en `AUDIO_FILES` (`src/game/systems/AudioSystem.ts`).

## Ranking / Supabase

Sin configuración, el ranking se guarda en el navegador. Para el ranking online:

1. Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase.
2. Definir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver `.env.example`, y en Vercel → Environment Variables).

El juego envía la puntuación **una sola vez**, al terminar la partida. Los rankings admiten filtro por periodo
(total / semana / hoy), evento y temporada.

## Controles

Mouse o touch para apuntar y disparar · `P`/`ESC` pausa · `M` sonido · en menús ↑ ↓ ENTER.
