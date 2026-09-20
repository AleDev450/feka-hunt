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

## Soundtrack

La partida suena en bucle con `public/assets/audio/soundtrack.mp3` (**música: piurano27** —
[video del gallinazo](https://www.youtube.com/watch?v=7fsMy1FpgsI)). Se reproduce en streaming con un `<audio>`,
en paralelo a los efectos.

## Niveles

Hay **50 niveles** (`VICTORY.levels`), cada uno más difícil (`DIFFICULTY` en settings.ts):

Las rampas van de `start` (nivel 1) a `end` (nivel 50) con una `curve` > 1: los primeros niveles
suben poquito y el salto gordo queda al final.

| Nivel | Velocidad | Tiempo para disparar | Gallinazos a la vez | Disparos |
|------:|----------:|---------------------:|--------------------:|---------:|
| 1     | 150 px/s  | 7.0 s                | 1                   | 3        |
| 10    | 185 px/s  | 6.6 s                | 2                   | 4        |
| 20    | 248 px/s  | 5.8 s                | 3                   | 5        |
| 30    | 328 px/s  | 4.9 s                | 3                   | 5        |
| 50    | 520 px/s  | 2.6 s                | 4                   | 6        |

Además los giros en zigzag son cada vez más bruscos y las trayectorias fáciles dejan de salir
(la recta desde el nivel 25, la ondulada desde el 41). Vida extra cada `PLAYER.extraLifeEvery` puntos (2500).

## Personajes

- **Gallinazos** (`imgs/gallinazos.png`): 6 tipos (clásico, narizón, serio, e-sport, mohicano y tranquilo).
  Cada gallinazo que aparece sortea su tipo; cada tipo tiene su propio aleteo, caída y pose de muerto.
- **Pequeño Jacinto** (`imgs/pequeno_jancito.png`, `src/game/entities/Jacinto.ts`): la mascota del cazador.
  Tiene 3 animaciones de 6 frames (idle, corriendo y recibir daño): corre a recoger el gallinazo abatido y
  celebra, y al fallar el jugador recibe el golpe gritando "¡AWAA!!" con `public/assets/audio/awa.mp3`.
  Posición y tiempos en `MASCOT` (settings.ts).
- **Cazador** (`imgs/nuevo_personaje.png`): usa un único sprite ("apuntando"); disparo, recarga, daño y celebración
  son efectos (retroceso, fogonazo, destello rojo, salto). De esa hoja sale también el retrato del HUD.
- **Grupo de amigos** (`imgs/grupo_amigos_3.png`, `src/game/entities/FriendsGroup.ts`): al fondo, detrás de la laguna.
  La hoja trae al grupo entero dibujado junto: un solo sprite con 4 poses animando y 4 tristes. Animan cada gallinazo abatido y se entristecen al fallar o cuando uno escapa, con sus frases. Posición, tiempos y frases en `FRIENDS` (settings.ts).

## Escenario

`src/game/world/Background.ts`: cielo por bandas, nubes, montañas, laguna, árbol a la izquierda y
**choza** a la derecha (`imgs/choza_para_background.png`), pasto delantero y arbustos.

## Entre niveles (alternan por nivel)

Al completar un nivel se pausa la canción y suena una escena, según el nivel terminado:

- **Niveles impares — "Chi amu gordo"** (`teamogordo.mp3`, 4 s).
- **Niveles pares — disco** (`ronchas.mp3`, 12.7 s): luces de colores, bola de discoteca, los amigos animando
  y Jacinto bailando (`src/game/cutscenes/DiscoInterlude.ts`, ajustes en `DISCO`; `maxMs` acorta la escena).

En la escena de los impares, mientras dura el audio,
la chica (`imgs/mujer.png`) sale de Jacinto, camina hasta el cazador, aparece "Chi amu gordo" con corazones y
vuelve con él (`src/game/cutscenes/LoveInterlude.ts`, tiempos en `LOVE`). El reloj de la canción
se congela durante la escena. En el final con SERFOR, la chica aparece llorando y termina capturada.

## Pantalla final

Al perder, 5 segundos después de entrar a la pantalla final arranca `public/assets/audio/shalala.mp3`
en bucle mientras se escribe el nombre para el ranking (`GAME_OVER_SONG` en settings.ts;
`onlyOnDefeat: false` para que suene también al ganar).

## Final: llega SERFOR

Al terminar la partida — **gana** (supera el nivel 50) o **pierde** (sin vidas) —
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

Nombres de hasta **12 caracteres** (letras, Ñ, números y espacios). Sin configuración, el ranking se guarda
en el navegador (solo ese dispositivo). Para el ranking online compartido con Supabase (gratis):

1. Crear una cuenta y un proyecto en <https://supabase.com> (plan Free).
2. En el proyecto: **SQL Editor → New query**, pegar todo `supabase/schema.sql` y pulsar **Run**
   (se puede volver a ejecutar sin problemas).
3. En **Project Settings → API** copiar la **Project URL** y la clave **anon public**.
4. Crear el archivo `.env.local` en la raíz del proyecto:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

5. Reiniciar `npm run dev`. La pantalla de ranking mostrará **RANKING ONLINE**.
6. En Vercel: **Settings → Environment Variables**, añadir las mismas dos variables y volver a desplegar.

La clave *anon* es pública por diseño; la seguridad la dan las políticas RLS del esquema.

La pantalla de ranking muestra el **top 50** de cada periodo (total / semana / hoy), paginado de 10 en 10
(botones ANTERIOR/SIGUIENTE, flechas ← → o rueda del ratón). El juego envía la puntuación **una sola vez**,
al terminar la partida. Los rankings admiten además filtro por evento y temporada.

## Controles

Mouse o touch para apuntar y disparar · `P`/`ESC` pausa · `M` sonido · en menús ↑ ↓ ENTER.
