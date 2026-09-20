# CHOLO FACTOS: LIMA RACING — prompt de implementación

Construir un vertical slice web arcade dentro de este proyecto, reutilizando Next.js 16, React 19, TypeScript, Phaser 4.2 y la configuración de escalado ya existente. No crear una aplicación Vite separada: el juego debe vivir como una nueva ruta y conservar el selector “Las aventuras de los Fekas”.

## Objetivo del primer prototipo

Crear una partida de 3 minutos ambientada en una Lima caricaturizada. La cámara observa desde atrás al vehículo y la carretera produce una ilusión pseudo-3D mediante segmentos escalados, capas parallax y sprites 2D. El juego debe funcionar a 60 FPS cuando el dispositivo lo permita y adaptarse a escritorio y móvil.

La primera zona será una avenida ficticia inspirada en Javier Prado. No copiar marcas, logotipos ni diseños reales. Usar `imgs/cholo/inicio.png`, `personaje.png`, `hud.png` y `883c6886-2351-4659-8092-3cc7e1863d87.png` como referencias; recortar y manifestar los sprites con un script reproducible, igual que `scripts/extract-sprites.mjs`.

## Flujo

- Ruta `/cholo` con menú: JUGAR, PERSONAJE, VEHÍCULOS, RANKING y CONFIGURACIÓN.
- Escena de juego con carretera infinita, tráfico, checkpoints, pasajeros, HUD y pausa.
- Resultado con distancia, pasajeros, casi choques, choques, combo, Factos activados, dinero y puntaje.
- Botón para volver al selector principal.

## Controles

Escritorio: A/Flecha izquierda cambia al carril izquierdo; D/Flecha derecha al derecho; W/Flecha arriba acelera; S/Flecha abajo frena; Espacio activa turbo; Shift usa la bocina.

Móvil: botones grandes izquierda, derecha, turbo y bocina. No depender exclusivamente del teclado.

## Sistemas aislados

Crear `CholoMenuScene`, `CholoGameScene`, `CholoGameOverScene`, `PlayerCar`, `TrafficVehicle`, `TrafficSystem`, `PassengerSystem`, `NearMissSystem`, `ComboSystem`, `FactosSystem`, `CholoHud`, `MobileControls` y configuraciones separadas para vehículos, niveles y habilidades. Usar object pooling para tráfico y partículas.

El vehículo inicial es una combi/taxi roja ficticia con franjas de carrera, cuadros blanco/negro, alerón y escape exagerado. El conductor usa el personaje proporcionado y estados idle, driving, turnLeft, turnRight, angry, shouting, victory, defeat y factosMode.

## Tráfico y conducción

Incluir taxi, auto normal, combi, bus y mototaxi. El auto mantiene velocidad media; el taxi cambia ocasionalmente de carril; la combi cambia agresivamente; el bus es lento y grande; la mototaxi es pequeña, rápida y errática. Las colisiones reducen velocidad, rompen el combo, producen partículas y un shake corto, pero no detienen inmediatamente la partida.

El jugador debe recoger pasajeros en checkpoints y entregarlos antes del límite. Estados del pasajero: NORMAL, NERVIOSO y ATERRORIZADO. Recompensas iniciales: S/15 excelente, S/10 bien y S/5 lento.

## Puntuación y habilidades

Near miss: +100; adelantamiento: +150; pasar entre dos vehículos: +300; maniobra extremadamente cercana: +500. Encadenar acciones crea combo y el combo se reinicia después de un choque o inactividad.

El FACTÓMETRO se llena con velocidad, near misses, adelantamientos y combos. Al 100% activa MODO FACTOS durante 7 segundos: velocidad +30%, multiplicador x2, shake leve, líneas de velocidad y tráfico que intenta apartarse. Mostrar “¡SOY EL CHOLO FACTOS!”.

Habilidades: ADEOFF (turbo de 2 segundos), SAL GORDO (bocina que aparta el tráfico frontal) y CUY ARMY (cuyes temporales que alteran el tráfico). Las frases “¡ADEOFF!”, “¡SAL GOOORDO!”, “¡ESCUCHAME UNA COSA CTMR!”, “¡SOY EL CHOLO FACTOS!” y “¡CUY ARMY PRESENTE!” deben tener cooldown y mostrarse como textos/burbujas.

## Rendimiento y límites

Usar Phaser Arcade Physics solo si simplifica las colisiones; no añadir Matter.js. No crear y destruir vehículos en cada frame. Mantener la lógica fuera de una escena monolítica. Añadir audio mediante `AudioSystem`, con placeholders propios para motor, turbo, bocina, choque, near miss, combo y Factos. No generar arte mediante código ni usar material con copyright.

Antes de desarrollar todo, entregar primero la estructura, el manifest de assets, la ruta `/cholo` y un vertical slice jugable con un vehículo, carretera, tráfico, controles, colisiones, puntuación, combo, Factómetro, HUD y game over. Después documentar cómo agregar sprites, vehículos, mapas, frases y habilidades.
