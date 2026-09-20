Quiero crear un videojuego web arcade de conducción ambientado en una versión caricaturizada de Lima, Perú.

El juego se llamará provisionalmente:

“CHOLO FACTOS: LIMA RACING”

CONCEPTO GENERAL
Debe sentirse como una mezcla entre Crazy Taxi, carreras arcade, tráfico limeño y humor/memes.

No quiero un simulador realista. Quiero un juego rápido, divertido, exagerado, fácil de jugar desde navegador y adaptable a PC y móvil.

El personaje principal es un taxista/conductor caricaturizado.

PERSONAJE PRINCIPAL
Debe usar:

- Traje rojo de piloto de Fórmula 1 / automovilismo, pero sin copiar marcas reales.
- Guantes negros.
- Detalles a cuadros blanco y negro.
- Rasgos ligeramente inspirados en un cuy:
  - pequeñas orejas redondas,
  - expresiones exageradas,
  - estilo cartoon.
- Mantener su rostro reconocible según los sprites/assets proporcionados.
- Actitud confiada, gritona y divertida.

Sus frases recurrentes son:

- “¡ADEOFF!”
- “¡SAL GOOORDO!”
- “¡ESCUCHAME UNA COSA CTMR!”
- “¡SOY EL CHOLO FACTOS!”
- “¡CUY ARMY PRESENTE!”

Estas frases deben aparecer como textos/burbujas durante ciertas acciones del juego.

IMPORTANTE:
Las frases pueden dispararse de manera aleatoria, pero debe existir un cooldown para evitar spam.

TECNOLOGÍA

Utilizar:

- Phaser 3
- TypeScript
- Vite
- Física arcade personalizada o Phaser Arcade Physics.

NO usar Matter.js inicialmente salvo que sea estrictamente necesario.

El objetivo es mantener buena performance incluso en dispositivos móviles.

El juego debe trabajar a 60 FPS siempre que el dispositivo lo permita.

PERSPECTIVA

Quiero un juego 2.5D / pseudo-3D visto desde atrás del vehículo.

La cámara sigue al vehículo principal.

La carretera se desplaza hacia el jugador dando sensación de velocidad.

Referencias conceptuales:
- OutRun
- Crazy Taxi
- Horizon Chase
- juegos arcade de autos de los 90

Pero con arte moderno cartoon.

NO quiero un mapa 3D completo inicialmente.

Quiero utilizar sprites 2D, carretera pseudo-3D y capas parallax.

GAMEPLAY PRINCIPAL

El jugador conduce por calles inspiradas en Lima mientras intenta llevar pasajeros hasta checkpoints.

Cada partida debe durar aproximadamente:

3 a 5 minutos.

Durante la partida tendrá que:

- esquivar autos;
- esquivar combis;
- esquivar buses;
- esquivar mototaxis;
- esquivar taxis;
- evitar huecos;
- evitar conos;
- cambiar de carril;
- adelantar;
- recoger pasajeros;
- llegar a checkpoints antes de que termine el tiempo.

CONTROLES PC

A / Flecha izquierda:
Moverse izquierda.

D / Flecha derecha:
Moverse derecha.

W / Flecha arriba:
Acelerar.

S / Flecha abajo:
Frenar.

ESPACIO:
Turbo / habilidad.

Opcional:
SHIFT = bocina.

CONTROLES MÓVILES

Crear:

- joystick virtual o botones izquierda/derecha;
- botón turbo;
- botón bocina.

Los botones deben ser grandes y cómodos.

TRÁFICO

Implementar tráfico dinámico.

Tipos iniciales:

1. Taxi
2. Auto normal
3. Combi
4. Bus
5. Mototaxi

Cada uno debe tener comportamiento diferente.

AUTO NORMAL:
velocidad media.

TAXI:
cambia ocasionalmente de carril.

COMBI:
cambia de carril agresivamente.

BUS:
lento y grande.

MOTOTAXI:
pequeño, rápido y errático.

Los vehículos deben aparecer usando object pooling.

No destruir/crear constantemente objetos porque quiero buena performance.

SISTEMA DE “CASI CHOQUE”

Crear un sistema de Near Miss.

Si el jugador pasa muy cerca de otro vehículo sin chocarlo:

+100 puntos

Mostrar:

“CASI CHOQUE +100”

Si realiza varios seguidos:

x2
x3
x4

Mostrar mensajes como:

“COMBI SLALOM”

“MANIOBRA FACTOS”

“CASI ME MATO”

SISTEMA DE COMBOS

Cada acción arriesgada aumenta un combo.

Ejemplo:

Near miss:
+100

Adelantamiento:
+150

Pasar entre dos vehículos:
+300

Pasar extremadamente cerca:
+500

El combo desaparece si:

- choca;
- pasa demasiado tiempo sin realizar maniobras.

FACTÓMETRO

Crear una barra llamada:

FACTÓMETRO

Se llena mediante:

- near misses;
- adelantamientos;
- velocidad alta;
- combos;
- maniobras peligrosas.

Cuando llega al 100%:

activar:

MODO FACTOS

Duración aproximada:

7 segundos.

Efectos:

- velocidad +30%;
- multiplicador x2;
- cámara con pequeño shake;
- pequeños efectos de velocidad;
- vehículos cercanos intentan apartarse.

Mostrar texto grande:

“¡SOY EL CHOLO FACTOS!”

Cuando comienza el modo.

HABILIDADES

Crear tres habilidades inicialmente.

1. ADEOFF

Turbo.

Duración:
2 segundos.

Aumenta fuertemente la velocidad.

Texto:

“¡ADEOFF!”

2. SAL GORDO

Usa la bocina.

Los vehículos directamente delante intentan cambiarse de carril.

Texto:

“¡SAL GOOORDO!”

3. CUY ARMY

Habilidad especial.

Aparecen pequeños cuyes cartoon corriendo cerca de la pista durante algunos segundos.

Los autos frenan o cambian de carril.

Texto:

“¡CUY ARMY PRESENTE!”

Debe ser una habilidad rara/especial.

COLISIONES

Los choques NO deben detener inmediatamente el juego.

Cuando el jugador choca:

- reducción temporal de velocidad;
- pequeño camera shake;
- partículas;
- romper combo;
- sonido de choque.

No utilizar daño realista.

Es un arcade.

PASAJEROS

Crear un sistema sencillo.

El jugador recoge un pasajero en determinado checkpoint.

Debe llevarlo hasta otro checkpoint.

Mientras más rápido llegue:

más dinero.

Ejemplo:

Excelente:
S/ 15

Bien:
S/ 10

Lento:
S/ 5

El pasajero debe reaccionar según cómo conduzca.

Estados:

NORMAL
NERVIOSO
ATERRORIZADO

Mostrar pequeños textos ocasionalmente.

Ejemplo:

“¡Jefe, más despacio!”

“¡Tengo familia!”

“¡Ya estamos llegando?!”

MAPAS

Crear inicialmente UNA zona jugable:

AV. JAVIER PRADO

No utilizar una reproducción exacta.

Debe ser una versión ficticia/caricaturizada inspirada en Lima.

Elementos visuales:

- buses;
- combis;
- edificios;
- puentes;
- señalización;
- árboles;
- publicidad ficticia;
- tráfico intenso.

Luego dejar la arquitectura preparada para agregar:

- Vía Expresa
- Centro de Lima
- Gamarra
- Callao
- La Molina
- Carretera Central

INTERFAZ

HUD superior izquierda:

PUNTAJE
128,750

DINERO
S/ 1,420

Centro/superior:

COMBO x3

Superior derecha:

TIEMPO
01:23

CHECKPOINT
420 m

Parte inferior:

FACTÓMETRO

████████░░

También mostrar velocímetro.

PANTALLA DE INICIO

Logo:

CHOLO FACTOS
LIMA RACING

Botones:

JUGAR

PERSONAJE

VEHÍCULOS

RANKING

CONFIGURACIÓN

SELECCIÓN DE VEHÍCULO

Inicialmente:

1. Taxi clásico
2. Tico ficticio
3. Station Wagon
4. Combi
5. Mototaxi

Los siguientes quedan bloqueados.

Mostrar:

VELOCIDAD
ACELERACIÓN
CONTROL
RESISTENCIA

No utilizar marcas reales.

VEHÍCULO PRINCIPAL

Para el prototipo:

una combi/taxi roja modificada para carreras.

Detalles:

- pintura roja;
- franjas de carrera;
- cuadros blanco/negro;
- pequeño alerón;
- escape deportivo;
- suspensión exagerada.

No copiar diseño exacto de ninguna marca real.

ANIMACIONES DEL PERSONAJE

Usar el spritesheet proporcionado.

Necesito estados:

idle
driving
turnLeft
turnRight
angry
shouting
victory
defeat
factosMode

El personaje puede aparecer:

- como retrato en HUD;
- durante cinemáticas breves;
- cuando activa habilidades;
- al terminar la partida.

RESULTADO DE PARTIDA

Mostrar:

DISTANCIA
6.2 KM

PASAJEROS
7

CASI CHOQUES
18

CHOQUES
3

COMBOS
8

FACTOS ACTIVADOS
2

DINERO
S/ 84

PUNTAJE
18,450

Botones:

JUGAR OTRA VEZ

RANKING

INICIO

ARQUITECTURA

Separar el proyecto en sistemas claros.

Ejemplo:

src/

scenes/
BootScene.ts
PreloadScene.ts
MenuScene.ts
GameScene.ts
GameOverScene.ts

entities/
PlayerCar.ts
TrafficCar.ts
Bus.ts
Combi.ts
Mototaxi.ts

systems/
TrafficSystem.ts
ScoreSystem.ts
ComboSystem.ts
FactosSystem.ts
PassengerSystem.ts
AudioSystem.ts

ui/
HUD.ts
MobileControls.ts
FactosBar.ts

config/
vehicles.ts
levels.ts
abilities.ts

assets/

NO poner toda la lógica dentro de GameScene.

Debe quedar fácil agregar nuevos mapas, vehículos y habilidades.

RESPONSIVE

Desktop:
16:9.

Resolución base:

1920x1080.

El canvas debe escalar manteniendo aspect ratio.

En móvil:

adaptar HUD y controles.

ASSETS

Utilizar placeholders cuando un asset todavía no exista.

Crear claves claras como:

player_car
traffic_taxi
traffic_bus
traffic_combi
traffic_mototaxi

driver_idle
driver_angry
driver_factos

road_javier_prado
building_01
building_02

No generar imágenes mediante código.

Dejar comentarios indicando dónde reemplazar assets.

SONIDO

Preparar soporte para:

engine_idle
engine_accelerate
horn
crash
near_miss
turbo
factos_mode
combo

Agregar música arcade energética de placeholder.

No utilizar material con copyright.

PRIMER OBJETIVO

NO desarrollar inmediatamente todos los mapas.

Primero crear un vertical slice completamente jugable.

Debe contener:

- menú;
- personaje;
- un vehículo;
- carretera infinita;
- tráfico;
- controles;
- colisiones;
- puntuación;
- combo;
- near miss;
- Factómetro;
- Modo Factos;
- HUD;
- game over;
- reiniciar partida.

La partida debe durar inicialmente 3 minutos.

Después podremos ampliar el juego.

IMPORTANTE SOBRE GAME FEEL

Quiero que conducir se sienta satisfactorio.

Agregar:

- easing al cambiar de carril;
- ligera inclinación visual del vehículo;
- screen shake pequeño al chocar;
- partículas cuando aceleramos;
- motion streaks durante turbo;
- zoom muy pequeño cuando entra el Modo Factos;
- floating text al ganar puntos.

El juego debe sentirse rápido y exagerado.

ESTILO VISUAL

Cartoon arcade.

Colores intensos.

Ambiente peruano/limeño reconocible.

No demasiado infantil.

Quiero algo que pueda funcionar como videojuego web divertido y compartible en redes.

Primero construye el prototipo funcional.

Luego explícame:

1. estructura creada;
2. cómo ejecutarlo;
3. dónde agregar mis sprites;
4. cómo agregar nuevos vehículos;
5. cómo agregar nuevos mapas;
6. cómo configurar las frases;
7. cómo modificar las habilidades.

Antes de comenzar a programar todo el juego, crea primero la estructura base y el GameScene jugable.