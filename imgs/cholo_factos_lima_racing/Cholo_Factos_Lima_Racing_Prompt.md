# Prompt de desarrollo — Cholo Factos: Lima Racing

Actúa como desarrollador senior de videojuegos web, especializado en Phaser, juegos arcade, perspectiva pseudo-3D, controles móviles y optimización. Implementa un juego completo y jugable llamado exactamente **Cholo Factos: Lima Racing**. No te limites a explicar cómo hacerlo: trabaja sobre el proyecto disponible, implementa por etapas, prueba y documenta lo que quede pendiente.

## 1. Contexto y reglas de trabajo

El proyecto es un juego web de conducción arcade por una Lima caricaturizada. El personaje es Cholo Factos: un taxista confiado, gritón y divertido que cree conducir perfectamente mientras todo a su alrededor es un caos. Su diseño tiene rasgos de cuy, traje rojo de Fórmula 1, guantes negros y detalles ajedrezados. Conserva su identidad y los gráficos existentes.

La referencia de ritmo y lectura visual es Subway Surfers: avance automático, tres carriles, obstáculos que se aproximan, coleccionables, velocidad progresiva y partidas que invitan a volver a jugar. No copies sus personajes, mapas, interfaz, música ni gráficos. Aquí el jugador controla un vehículo, no un personaje que corre.

Antes de modificar:

- Inspecciona la estructura, dependencias, versión instalada de Phaser, escenas y assets.
- El proyecto está planteado para Phaser 4: conserva esa versión si ya está instalada y valida las API contra su documentación oficial. No mezcles ejemplos incompatibles de versiones distintas ni cambies de motor sin explicar el bloqueo y pedir autorización.
- Conserva el framework, gestor de paquetes, registro, ranking y backend existentes cuando sean utilizables. No reescribas todo ni borres funcionalidades ajenas.
- Si no existe proyecto, plantea una base mínima con Phaser, TypeScript y Vite, verificando primero la compatibilidad de dependencias.
- No publiques, cambies permisos de producción ni ejecutes migraciones destructivas sin autorización.
- Las cifras de este documento son parámetros iniciales de diseño, no valores inamovibles: centralízalos para poder ajustar el balance.

## 2. Experiencia principal

Cholo Factos conduce un taxi/combi roja de estética deportiva por tres carriles. Usa el vehículo protagonista que exista entre los assets, sin alternar arbitrariamente entre modelos.

La cámara mira hacia delante desde detrás del vehículo. La carretera converge hacia el horizonte; los vehículos y obstáculos nacen pequeños en la lejanía y crecen al acercarse. El jugador permanece cerca de la parte inferior de la pantalla.

Implementa esta sensación con sprites y proyección pseudo-3D. No presentes una carretera cenital plana como resultado final ni prometas 3D real. Mantén separados los datos lógicos de distancia/carril y su representación en pantalla.

El ciclo de juego es:

1. Empezar a conducir automáticamente.
2. Cambiar de carril para esquivar tráfico y recoger soles.
3. Recoger un pasajero en una zona señalizada.
4. Llegar a su punto de entrega antes del límite del viaje.
5. Cobrar la recompensa y aumentar el combo.
6. Llenar el Factómetro mediante buena conducción.
7. Activar FACTOS MODE para una ráfaga de turbo e invulnerabilidad.
8. Sobrevivir al aumento de dificultad y, después de varios choques, a una persecución policial.
9. Terminar, ver resultados y reintentar inmediatamente.

## 3. Controles y movimiento

| Acción | PC | Móvil |
| --- | --- | --- |
| Carril izquierdo | Flecha izquierda o A | Deslizar a la izquierda o botón |
| Carril derecho | Flecha derecha o D | Deslizar a la derecha o botón |
| Frenar | Mantener flecha abajo o S | Mantener botón de freno |
| Activar FACTOS MODE | Espacio | Botón del Factómetro |
| Pausa | Escape o P | Botón de pausa |

- Aceleración automática y tres carriles lógicos: -1, 0, 1.
- Cambio de carril suave de unos 180–250 ms, con inclinación visual del vehículo y sombra coherente.
- Un gesto equivale a un cambio; evita saltos accidentales de dos carriles y limita la cola de entradas.
- Frenar reduce temporalmente la velocidad, nunca permite detenerse indefinidamente. Usa una reserva regenerable de freno para evitar abuso.
- No añadas saltos, deslizamientos bajo vehículos ni física de simulador en esta primera versión.
- Desactiva el scroll de la página solo en la superficie de juego; respeta el resto de la interfaz.
- Pausa al perder visibilidad o foco para evitar muertes injustas.

## 4. Carretera, perspectiva y generación

- Usa una distancia longitudinal lógica para calcular el avance de cada entidad respecto al jugador.
- Proyecta carril, posición vertical y escala en función de esa distancia y del ancho de carretera a cada profundidad.
- Ordena sprites por profundidad; resuelve solapamientos de forma estable.
- Desplaza marcas viales y decorados laterales de forma continua; oculta las uniones entre tramos.
- Las colisiones deben usar posiciones lógicas de carril, transición lateral y distancia, no solamente el tamaño aparente de los sprites escalados.
- Genera patrones jugables, no obstáculos completamente aleatorios. Debe existir una ruta alcanzable considerando velocidad y tiempo de cambio de carril.
- Reserva suficiente anticipación para reaccionar y no generes obstáculos encima del jugador ni bloqueos inevitables.
- Los vehículos de tráfico pueden cambiar de carril en fases avanzadas, siempre con una señal previa visible.

Zonas visuales progresivas: calle comercial, avenida con combis, mercado con mototaxis, zona de obras y vía rápida. Usa transiciones graduales y reutiliza elementos cuando falten fondos. No bloquees el primer prototipo por no disponer de cinco escenarios completos.

## 5. Obstáculos y colisiones

Incluye, según los assets disponibles: taxis, combis, buses, mototaxis, conos, barreras de obra y huecos. Los peatones y vendedores pertenecen a las veredas; no conviertas atropellarlos en objetivo.

Reglas iniciales:

- Obstáculo leve: pierde velocidad, se rompe el combo y se reproduce una reacción.
- Vehículo o barrera grande: resta un corazón, reduce velocidad y aumenta la alerta policial.
- Empieza con tres corazones. Al llegar a cero termina la partida por avería.
- Tras recibir daño, concede aproximadamente 1,2 segundos de inmunidad para evitar múltiples impactos del mismo choque.
- Un mismo obstáculo solo debe cobrar daño una vez.
- Los casi choques conceden puntos una sola vez por entidad y solo cuando realmente existe proximidad sin colisión.
- Un cambio de carril sin riesgo no otorga Factómetro: evita premiar pulsaciones repetidas sin propósito.

## 6. Pasajeros y viajes

Solo puede existir un pasajero activo. La recogida sucede en una zona lateral señalizada con antelación: entrar en su carril y pasar a velocidad reducida recoge al pasajero automáticamente, sin una pantalla que corte la acción.

- Muestra nombre o apodo ficticio, destino, distancia pendiente y tiempo restante.
- El destino es un checkpoint a una distancia lógica; al aproximarse, señala con claridad el carril de entrega.
- La entrega se completa entrando en ese carril a velocidad reducida antes de agotarse el tiempo.
- El tiempo del viaje debe calcularse según distancia, velocidad prevista y un margen razonable, incluyendo frenado y maniobras.
- Entrega a tiempo: recompensa en soles ficticios, puntos y avance de combo.
- Tiempo agotado o entrega fallida: cancela el viaje y rompe el combo, pero no termina toda la partida. El pasajero baja mediante una transición cómica segura, sin mostrar saltos al tráfico.
- No ofrezcas recogidas o entregas dentro de patrones que las hagan imposibles.

Usa destinos ficticios inspirados en Lima; no hacen falta mapas reales ni geolocalización. Los soles son una moneda del juego, sin valor ni retiro de dinero real.

## 7. Factómetro y FACTOS MODE

Barra de 0 a 100. Parámetros iniciales: moneda +1, casi choque +8, entrega +25 y tramo limpio de 15 segundos +10. Impide duplicar eventos y limita la carga al máximo.

Al estar lleno, habilita un botón destacado. La activación es voluntaria y consume la barra completa.

Durante unos 6 segundos:

- Turbo, aura de fuego, estela y efectos de velocidad moderados.
- Invulnerabilidad frente al tráfico y obstáculos.
- Puntuación de acciones y distancia multiplicada por dos; no dupliques automáticamente el dinero de pasajeros.
- Frase “¡SOY EL CHOLO FACTOS!”.
- Los obstáculos se apartan o desaparecen con un efecto caricaturesco, sin bloquear el avance.
- No se recarga el Factómetro mientras está activo.

Al acabar, vuelve suavemente a la velocidad normal y garantiza un pequeño margen de seguridad. Si hay una entrega durante el modo, respeta el freno o permite completarla sin penalización para evitar conflictos entre mecánicas.

## 8. Policía

Muestra un indicador de alerta separado de los corazones. Como configuración inicial, dos choques graves en una ventana de 20 segundos activan la persecución.

- La patrulla aparece detrás, con sirena y un medidor de proximidad.
- Conducir sin impactos aumenta la separación; los choques la reducen.
- Frenar demasiado facilita que se acerque.
- FACTOS MODE permite ganar distancia.
- Si la proximidad llega al umbral de captura, termina la partida.
- Tras mantener suficiente separación durante varios segundos, finaliza la persecución y se reinicia la alerta.

La policía no debe aparecer ni capturar de forma instantánea. Implementa estados explícitos: sin alerta, advertencia, persecución, escape y captura.

## 9. Identidad, humor y audio

Nombre exacto en menú, HUD donde corresponda y resultados: **Cholo Factos: Lima Racing**.

Frases disponibles:

- “¡ADEOFF!”: turbo o escape.
- “¡SAL GOOORDO!”: maniobra cerca de un vehículo.
- “¡ESCUCHAME UNA COSA CTMR!”: choque; permitir una opción de lenguaje suavizado.
- “¡SOY EL CHOLO FACTOS!”: activación del modo especial.
- “¡CUY ARMY PRESENTE!”: celebración o récord.

Introduce un tiempo de espera entre frases y evita superponer voces. Si no hay archivos de audio autorizados, usa burbujas de texto y efectos disponibles; no inventes rutas de audio ni clones voces. Música y efectos con controles de volumen y silencio; desbloquea el sonido tras una interacción del jugador.

## 10. Assets existentes

Busca recursos con estos nombres base y conserva su escritura original, incluida la palabra `pasarejos`:

| Nombre base | Uso previsto |
| --- | --- |
| `background` | Fondos y ambientación |
| `obstaculos` | Conos, barreras, huecos y objetos de vía |
| `pasarejos` | Pasajeros y personajes secundarios |
| `vehiculos` | Vehículo principal, tráfico y patrulla si existe |
| `botones` | Controles y botones de interfaz |
| `adicionales` | Monedas, iconos, efectos y elementos complementarios |

También reutiliza `inicio`, `hud` y `personaje` si realmente están en el proyecto y encajan con el diseño. Estos nombres son referencias de búsqueda, no una garantía de rutas, extensiones ni contenido.

Antes de cargar spritesheets:

- Inspecciona dimensiones, transparencia, cantidad de cuadros, separación, márgenes y perspectiva de cada imagen.
- Si la cuadrícula es uniforme, declara medidas reales verificadas. Si no, crea un atlas con recortes explícitos.
- No supongas que todos los cuadros son iguales ni que una hoja ilustrativa está lista para animación.
- Excluye títulos, etiquetas y fondos de los recortes jugables.
- Mantén escala visual, punto de anclaje y orientación coherentes.
- No estires una vista frontal para simular una vista trasera. Si falta la perspectiva necesaria, usa un recurso temporal claramente identificado e informa qué gráfico se necesita.
- Centraliza claves, rutas y animaciones en un manifiesto.
- Reutiliza los recursos reales. Los placeholders son temporales, no el acabado final, y deben quedar documentados.

## 11. Pantallas e interfaz

Diseña primero para móvil vertical, con referencia lógica de 720 × 1280 y adaptación sin deformar sprites. En escritorio centra el juego y usa el espacio sobrante como marco decorativo, sin ampliar el campo visible para dar ventaja.

Pantallas:

1. Carga con progreso real y tratamiento de archivos fallidos.
2. Menú: título, personaje/vehículo, Jugar, Cómo jugar, Ranking y Sonido.
3. Tutorial corto e interactivo, omisible y repetible.
4. Partida: puntos, soles, distancia, corazones, pasajero y tiempo, Factómetro, alerta/policía y pausa.
5. Pausa: Continuar, Reiniciar, Sonido y Menú; confirmar antes de abandonar la partida.
6. Resultados: causa de finalización, puntuación, distancia, soles, pasajeros entregados, récord, Reintentar y Menú.
7. Ranking: distinguir claramente récords locales de clasificación online.

Prioriza legibilidad: no tapes los obstáculos con textos, utiliza botones táctiles cómodos y respeta zonas seguras de pantalla. Añade una opción para reducir sacudidas y destellos.

## 12. Puntuación y dificultad

Configura una fórmula clara: puntos por distancia, monedas, entregas y casi choques. Muestra puntuación y soles como métricas diferentes. Aplica multiplicadores una sola vez en un sistema central.

- Inicio amable con espacio para aprender.
- Aumento gradual de velocidad, densidad y variedad de patrones.
- Establece una velocidad máxima y un mínimo de tiempo de reacción.
- A mayor velocidad, aumenta también la distancia de anticipación del generador.
- Introduce una mecánica nueva cada vez; no combines todo durante los primeros segundos.
- Prioriza sesiones ágiles y reintento rápido; calibra el balance mediante pruebas reales.
- El avance y los temporizadores deben depender del tiempo transcurrido, no del número de frames. Limita saltos de delta al recuperar la pestaña.

## 13. Arquitectura y rendimiento

Adapta los nombres a la estructura existente. Separa responsabilidades equivalentes a carga, menú, juego, HUD y resultados. Extrae sistemas de carretera/proyección, control, generación, colisión, pasajeros, persecución, puntuación, audio y persistencia.

- Estado de partida explícito: menú, jugando, pausado y terminado.
- Eventos desacoplados entre lógica y HUD.
- Configuración central para balance, dificultad y controles.
- Pool de objetos para tráfico, obstáculos, monedas y partículas.
- Limpieza de listeners, temporizadores y recursos al cambiar de escena.
- Límite de objetos activos y efectos ajustables para dispositivos modestos.
- Busca fluidez de 60 FPS, pero mide y reporta el entorno probado; no asegures rendimiento universal.
- Proporciona un modo de depuración desactivado en producción para hitboxes, distancias, patrones y estados.

## 14. Guardado y ranking

La partida debe funcionar sin backend. Guarda en local las preferencias y el récord personal, identificándolo como no verificado. Si ya hay backend, conserva e integra sus contratos después de revisarlos.

Para un ranking online con Supabase u otro servicio:

- No permitas que el navegador inserte o actualice libremente puntuaciones oficiales.
- Nunca expongas claves privilegiadas en el cliente.
- Propón un endpoint de envío validado, sesiones de partida, controles de frecuencia, protección contra reenvíos y validación de duración, eventos y límites plausibles.
- Para resultados competitivos, diseña validación/reproducción del recorrido y eventos en servidor, o una simulación autoritativa. Un puntaje declarado por el cliente más controles básicos no equivale a un sistema antitrampas.
- Las escrituras privilegiadas deben quedar en servidor y la lectura pública debe exponer solo los campos necesarios.
- No prometas impedir todas las trampas ni presentes CAPTCHA o RLS por sí solos como validación de puntuaciones.
- No modifiques tablas, vistas o políticas existentes a ciegas. Entrega propuestas de migración separadas para revisión.
- Sin conexión, conserva el resultado como local; nunca muestres que se publicó si el envío falló.

## 15. Orden de implementación

1. Inspeccionar proyecto y assets; explicar brevemente qué se reutiliza y qué falta.
2. Prototipo jugable: carretera en perspectiva, vehículo, tres carriles y controles PC/móvil.
3. Generación alcanzable, tráfico, colisiones, monedas, puntos y reinicio.
4. Pasajeros, entregas y dificultad progresiva.
5. Factómetro, FACTOS MODE y persecución.
6. Interfaz final, humor, animaciones, audio y accesibilidad básica.
7. Persistencia y ranking, según infraestructura disponible.
8. Pruebas, correcciones, optimización y documentación.

Trabaja con avances jugables. No entregues una portada estática como si fuera el juego. Si falta un recurso no crítico, continúa con un reemplazo temporal documentado; consulta solo bloqueos que requieran una decisión real del propietario.

## 16. Criterios de aceptación y entrega

- El título es exactamente Cholo Factos: Lima Racing.
- Se puede iniciar, jugar, pausar, perder y reiniciar sin recargar la página.
- Cámara detrás del vehículo y profundidad visual coherente, no vista cenital plana.
- Teclado y gestos/botones móviles funcionan sin entradas duplicadas.
- No se puede salir de los tres carriles.
- Los patrones mantienen rutas alcanzables a todas las velocidades.
- Las colisiones no cobran daño repetido por el mismo impacto.
- Pasajeros se recogen, entregan y cancelan correctamente; el reloj se detiene en pausa.
- Factómetro y multiplicadores no admiten acumulación duplicada ni activaciones simultáneas.
- La policía puede perseguir, perder al jugador y capturarlo con indicaciones claras.
- Al reiniciar no quedan listeners, enemigos ni temporizadores de la partida anterior.
- No hay errores de carga ni excepciones de consola en los recorridos probados.
- Probar resolución móvil y escritorio, cambio de tamaño, pérdida de foco, audio bloqueado y fallo de red.
- Ejecutar build, comprobación de tipos y tests disponibles. Añadir pruebas lógicas para puntuación, colisión única, transiciones de estado y generación alcanzable cuando el entorno lo permita.
- Entregar código implementado, comandos exactos para ejecutar, mapa de assets, parámetros ajustables, pruebas realizadas y limitaciones pendientes. Distinguir claramente lo probado de lo supuesto.

Prioridad final: controles inmediatos, obstáculos legibles, perspectiva convincente, partidas justas, humor de Cholo Factos y ganas de reintentar.
