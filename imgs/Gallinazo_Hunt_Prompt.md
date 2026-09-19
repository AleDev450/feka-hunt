# Prompt --- GALLINAZO HUNT

## Objetivo

Desarrollar un juego web 2D inspirado en el concepto clásico de **Duck
Hunt**, pero con identidad visual y temática propia:

-   El protagonista es el chico de la imagen de referencia proporcionada
    por el usuario.
-   Los enemigos son **gallinazos** en lugar de patos.
-   El juego debe tener estética retro 16-bit / arcade.
-   Debe funcionar tanto en desktop como en dispositivos móviles.
-   El objetivo inicial es crear un MVP jugable y luego dejar una
    arquitectura preparada para ranking, usuarios, eventos y futuras
    mecánicas.

## Stack tecnológico

Usar:

-   **Phaser** como motor principal del juego.
-   **TypeScript**.
-   **Next.js** para la aplicación/web que contiene el juego.
-   **Supabase** para persistencia futura de usuarios, partidas,
    puntuaciones y ranking.
-   **Vercel** para deployment.

No utilizar Unity, Godot ni Canvas puro para la implementación
principal.

## Arquitectura recomendada

Separar claramente la aplicación web del código del juego.

``` text
src/
├── app/
│   ├── page.tsx
│   └── jugar/
│       └── page.tsx
│
├── game/
│   ├── config/
│   │   └── gameConfig.ts
│   │
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── MenuScene.ts
│   │   ├── GameScene.ts
│   │   └── GameOverScene.ts
│   │
│   ├── entities/
│   │   ├── Hunter.ts
│   │   ├── Vulture.ts
│   │   └── Dog.ts
│   │
│   ├── systems/
│   │   ├── SpawnSystem.ts
│   │   ├── ScoreSystem.ts
│   │   ├── DifficultySystem.ts
│   │   └── AudioSystem.ts
│   │
│   └── utils/
│       └── gameUtils.ts
│
└── assets/
    ├── sprites/
    ├── backgrounds/
    ├── audio/
    └── ui/
```

## MVP --- Primera versión jugable

Implementar primero solamente el núcleo del juego.

### Flujo

``` text
MENÚ
  ↓
INICIAR PARTIDA
  ↓
NIVEL
  ↓
APARECE GALLINAZO
  ↓
VUELA POR LA PANTALLA
  ↓
JUGADOR APUNTA
  ↓
DISPARA
  ↓
¿IMPACTO?
 ├── SÍ → gallinazo cae → +puntos
 └── NO → pierde munición
  ↓
¿GALLINAZO ESCAPA?
 └── pierde una vida
  ↓
SIGUIENTE GALLINAZO
  ↓
Aumenta progresivamente la dificultad
```

## Mecánica principal

El jugador debe poder apuntar con:

-   Mouse en desktop.
-   Touch en móvil.

Mostrar una mira/crosshair sobre la posición del cursor o dedo.

Al hacer click/tap:

1.  Reproducir sonido de disparo.
2.  Crear un pequeño efecto visual de muzzle flash.
3.  Detectar si la mira intersecta al gallinazo.
4.  Si hay impacto:
    -   reproducir animación de golpe;
    -   reproducir sonido;
    -   cambiar el estado del gallinazo;
    -   hacerlo caer;
    -   sumar puntos.
5.  Si falla:
    -   consumir una bala;
    -   reproducir feedback visual/sonoro.

## Gallinazos

Crear una entidad `Vulture` con estados:

``` text
FLYING
HIT
FALLING
DEAD
ESCAPED
```

Debe poder:

-   Entrar desde diferentes lados.
-   Volar con trayectoria variable.
-   Cambiar ligeramente de altura.
-   Tener animación de aleteo.
-   Ser impactado por el jugador.
-   Caer cuando recibe un disparo.
-   Desaparecer al salir de pantalla.
-   Tener velocidades variables según dificultad.

No hacer que todos los gallinazos sigan exactamente la misma
trayectoria.

## Dificultad

Crear un sistema progresivo.

Ejemplo:

### Nivel 1

-   1 gallinazo.
-   Velocidad baja.
-   Trayectorias simples.
-   3 disparos.

### Nivel 2

-   Mayor velocidad.
-   Trayectorias más variadas.

### Nivel 3+

-   Mayor velocidad.
-   Gallinazos aparecen desde diferentes direcciones.
-   Posibilidad de varios enemigos simultáneos.
-   Menor tiempo disponible para disparar.

La dificultad debe estar centralizada en `DifficultySystem.ts`, evitando
valores hardcodeados por todo el proyecto.

## Puntuación

Implementar inicialmente:

``` text
Gallinazo impactado: +100
Headshot: +250
Combo: multiplicador
Gallinazo escapado: -1 vida
```

Mostrar:

``` text
SCORE
000450

RECORD
001200

VIDAS
❤️ ❤️ ❤️

MUNICIÓN
🔴 🔴 🔴 🔴 🔴
```

Los valores deben ser fáciles de modificar desde una configuración
central.

## Personaje

Utilizar el personaje masculino de la imagen de referencia
proporcionada.

Crear animaciones/estados para:

``` text
IDLE
APUNTANDO
DISPARANDO
RETROCESO
RECARGA
HERIDO
```

Si el personaje permanece principalmente como elemento visual durante el
gameplay, priorizar una implementación sencilla y fluida antes que una
animación excesivamente compleja.

## Perro

Incluir al perro como personaje secundario inspirado en el concepto
clásico de Duck Hunt, pero con diseño propio.

Estados iniciales:

``` text
IDLE
CORRIENDO
LADRANDO
SENTADO
EXCITADO
```

El perro puede reaccionar a:

-   gallinazo impactado;
-   gallinazo escapado;
-   final de ronda.

No convertirlo en una mecánica compleja durante el MVP.

## Escenario

Crear un escenario natural retro:

-   cielo azul;
-   nubes;
-   vegetación;
-   árboles;
-   arbustos;
-   terreno;
-   opcionalmente laguna.

El fondo debe permitir movimiento y composición de enemigos sin
dificultar la lectura de los gallinazos.

Priorizar contraste entre:

-   fondo;
-   gallinazos;
-   mira;
-   HUD.

## Sprites

Utilizar el spritesheet proporcionado como referencia visual.

Antes de implementar, identificar correctamente:

-   frames del personaje;
-   frames de gallinazo;
-   perro;
-   objetos;
-   elementos del escenario;
-   UI.

No asumir automáticamente que todos los elementos del spritesheet tienen
exactamente el mismo tamaño.

Preparar los assets para Phaser de forma que las animaciones puedan
configurarse mediante `generateFrameNumbers` o equivalente cuando
corresponda.

## Pixel Art

Configurar Phaser para mantener el estilo pixel art:

-   evitar suavizado innecesario;
-   mantener pixel-perfect rendering cuando sea posible;
-   utilizar `pixelArt: true`;
-   evitar escalados que deformen los sprites;
-   mantener una resolución interna coherente.

El juego debe sentirse como un arcade 16-bit moderno, no como una
aplicación web convencional.

## Responsive

Diseñar primero una resolución lógica de juego, por ejemplo:

``` text
1280 x 720
```

y adaptar la escala al viewport.

Debe funcionar correctamente en:

-   PC;
-   laptop;
-   tablet;
-   teléfono vertical;
-   teléfono horizontal.

En móvil, permitir controles táctiles sin que el HUD bloquee el área de
juego.

## UI

Crear una interfaz retro moderna:

### Menú

``` text
GALLINAZO HUNT

[ INICIAR ]

[ CÓMO JUGAR ]

[ RANKING ]
```

### Gameplay

Mostrar:

``` text
SCORE
RECORD
VIDAS
MUNICIÓN
NIVEL
COMBO
```

### Game Over

``` text
GAME OVER

SCORE
002450

RECORD
005200

[ JUGAR DE NUEVO ]

[ RANKING ]
```

## Sonido

Preparar una estructura para:

-   disparo;
-   impacto;
-   gallinazo cayendo;
-   gallinazo escapando;
-   recarga;
-   botón;
-   combo;
-   game over;
-   música de fondo.

No depender de archivos de audio específicos durante el primer
prototipo: crear placeholders si todavía no existen.

## Rendimiento

Evitar crear y destruir constantemente objetos si puede utilizarse
pooling.

Para los gallinazos, considerar un sistema de reutilización de sprites
cuando el número de enemigos aumente.

Evitar:

-   demasiadas partículas;
-   demasiados objetos simultáneos;
-   loops innecesarios;
-   lógica pesada por frame.

El juego debe mantener una experiencia fluida en teléfonos de gama
media.

## Supabase --- Preparación futura

No es necesario implementar todo en el MVP, pero preparar interfaces
para posteriormente guardar:

``` text
users
games
scores
leaderboards
game_sessions
```

Una puntuación podría tener conceptualmente:

``` text
user_id
score
level
accuracy
shots
hits
combo
created_at
```

No conectar la lógica del juego directamente a Supabase en cada disparo.

Primero terminar la partida y luego enviar el resultado.

## Ranking

Preparar una futura pantalla:

``` text
RANKING

#1  PLAYER       12500
#2  PLAYER       11200
#3  PLAYER       9800
#4  PLAYER       8700
#5  PLAYER       8100
```

El sistema debe quedar preparado para rankings por:

-   puntuación;
-   evento;
-   fecha;
-   temporada.

## Código

Buenas prácticas:

-   TypeScript estricto.
-   Componentes y clases con responsabilidad única.
-   Evitar archivos gigantes.
-   Evitar lógica duplicada.
-   Centralizar configuración.
-   Usar nombres claros.
-   Comentarios solamente donde aporten contexto.
-   No utilizar soluciones innecesariamente complejas.

## Integración Next.js + Phaser

Phaser debe ejecutarse únicamente en el cliente.

Evitar problemas de SSR/hydration.

Crear el juego mediante un componente cliente, por ejemplo:

``` text
GameCanvas.tsx
```

y mantener toda la lógica específica del juego dentro de `src/game`.

No mezclar directamente la lógica de Phaser con componentes React salvo
para comunicación explícita como:

-   iniciar;
-   pausar;
-   terminar;
-   mostrar resultados.

## Primera entrega

No intentar desarrollar todo el sistema de una sola vez.

Primero entregar:

1.  Proyecto Next.js funcionando.
2.  Phaser integrado.
3.  Escena de menú.
4.  Escena de juego.
5.  Fondo.
6.  Personaje.
7.  Gallinazo.
8.  Animación de vuelo.
9.  Mira.
10. Disparo.
11. Detección de impacto.
12. Animación de caída.
13. Score.
14. Vidas.
15. Munición.
16. Game Over.
17. Reinicio.

Después de comprobar que el MVP funciona, implementar:

``` text
FASE 2
├── dificultad
├── combos
├── perro
├── sonidos
└── mejores animaciones

FASE 3
├── Supabase
├── usuarios
├── ranking
└── estadísticas

FASE 4
├── eventos
├── temporadas
├── recompensas
└── códigos/promociones
```

## Importante

El objetivo no es copiar Duck Hunt literalmente.

Tomar solamente como referencia la idea general de:

> apuntar → disparar → acertar enemigos → obtener puntuación.

Todo el arte, personajes, nombre, interfaz, efectos y mecánicas
adicionales deben tener identidad propia.

El resultado debe sentirse como un **arcade peruano de gallinazos**,
divertido, rápido y reconocible.

## Resultado esperado

Al terminar el MVP debe ser posible abrir:

``` text
/jugar
```

y tener una partida completamente jugable:

``` text
MENÚ
 ↓
INICIAR
 ↓
GALLINAZO APARECE
 ↓
MOVER MIRA
 ↓
DISPARAR
 ↓
IMPACTO
 ↓
+100
 ↓
SIGUIENTE GALLINAZO
 ↓
GAME OVER
 ↓
REINICIAR
```

Prioridad absoluta:

**jugabilidad \> arquitectura perfecta \> cantidad de contenido.**

Primero hacer que sea divertido jugarlo.
