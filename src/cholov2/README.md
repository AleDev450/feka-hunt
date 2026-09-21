# Cholo Factos: Lima Racing

La especificación principal es `imgs/cholov2/Cholo_factos.md`. Juego independiente en `/cholov2`, con Phaser 4.2.1 y el proyecto existente de Next.js y TypeScript. No necesita dependencias adicionales.

## Ejecutar

```sh
npm run dev
# Abrir http://localhost:3000/cholov2
npm run sprites:cholo  # Regenerar recortes desde imgs/cholov2
npm run test:cholo     # Pruebas de simulación e interacción de controles
npm run typecheck
npm run build
```

## Partida

El taxi acelera automáticamente. A/D o flechas dirigen; S o flecha abajo frena hasta detenerse; espacio activa el turbo mientras queda Factómetro. Escape abre la pausa. En pantalla hay cuatro botones que admiten dirección y freno/turbo simultáneos. En celular se recomienda orientación horizontal; el lienzo respeta las áreas seguras.

La parada verde está en la vereda derecha. Hay que acercarse, reducir la velocidad y mantener la parada brevemente. Tras recoger al pasajero aparece su destino; hay que detenerse allí para cobrar. Llegar a tiempo añade una bonificación. Pasarse una parada genera otra oportunidad más adelante. Solo se transporta un pasajero a la vez.

El tráfico incluye autos, combis, buses, mototaxis y camiones. Las combis varían su velocidad y los mototaxis anuncian los cambios laterales. Los obstáculos tienen efectos diferentes; monedas y reparaciones son recogibles. El turbo consume Factómetro y no protege de golpes.

Un choque con tráfico inicia la persecución, con patrullero frontal en el retrovisor. Frenar permite que la policía se acerque; conducir rápido permite escapar. Hay un período de gracia y la captura exige mantener una distancia muy corta. Durante la persecución se suspende la atención al pasajero y se congela su plazo. La partida termina por captura o vida agotada, sin límite artificial de tres minutos.

Pausar o perder el foco detiene la simulación y limpia los controles. Para volver es necesario continuar explícitamente. Reiniciar crea una simulación nueva y elimina los listeners de la anterior.

## Organización

- `createCholoGame.ts`: instancia, escala, montaje y destrucción de Phaser.
- `scenes/Screens.ts`: carga, portada, instrucciones, resultados y ranking.
- `scenes/DriveScene.ts`: conexión entre simulación, controles y representación visual.
- `systems/`: jugador, tráfico, pasajeros, policía, puntuación, audio y persistencia.
- `render/`: carretera por segmentos proyectados, profundidad, escenario y efectos reutilizables.
- `ui/`: HUD, controles y botones.
- `config.ts`: velocidades, daños, dificultad, generación y recompensas.
- `assets.json`: manifiesto generado de recortes con nombres descriptivos.

## Recursos y persistencia

Se conservan los originales. `scripts/extract-cholo-assets.mjs` genera 117 recursos en `public/assets/cholov2/v2` y una hoja de revisión en `artifacts/cholov2/contact-sheet.png`. El archivo suministrado se llama `pasajeros.png`; el extractor también admite `pasarejos.png`. Las poses del taxi se seleccionan por dirección/freno. Humo, impactos, agua y llamas utilizan sus secuencias.

La carretera, marcas, sombras, zonas de parada y textos se dibujan con Phaser. Los sonidos de motor, sirena, golpes, botones y cobro se sintetizan con Web Audio tras una interacción. No se añadió música externa. La portada usa `public/assets/cholo-inicio.png`; los valores pintados en la ilustración no se utilizan como HUD de la partida.

Según la especificación nueva, los resultados de Cholo se guardan automáticamente en `cholo-factos:v2:results` y el silencio en `cholo-factos:muted`. Se conservan hasta 100 resultados, y el ranking muestra los ocho mejores. Son datos locales de ese navegador, editables y no compartidos con otros dispositivos; no constituyen un ranking online validado. La integración de Supabase de Gallinazo permanece independiente.

## Validación realizada

- Compilación de producción y comprobación TypeScript.
- `/cholov2` y los 117 PNG generados respondieron HTTP 200 en el servidor local; se verificaron dimensiones y canal alfa de los archivos.
- Inspección visual de las hojas originales y del contacto generado.
- 15 pruebas sobre las clases reales: acelerar/frenar, dirección continua, límites, consistencia a 30/60/120 FPS, delta largo, recogida y entrega, retrasos y paradas perdidas, suspensión por policía, impactos, protección temporal, recogibles, adelantamientos únicos, consumo de turbo, captura/escape, generación de tráfico y resultados locales.
- Una prueba conduce de forma continua hasta completar dos servicios sin teletransportar el taxi.
- La prueba de controles combina dos punteros y comprueba liberación fuera del botón y limpieza; usa un doble de eventos, no un dispositivo táctil real.

Pendiente: comprobar la composición durante una partida renderizada, audio real, consola del navegador, cambios de tamaño y gestos en dispositivos. La sesión de desarrollo no disponía de un navegador conectado; las pruebas de lógica y compilación no sustituyen esa revisión.
