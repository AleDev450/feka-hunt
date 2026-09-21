Actúa como desarrollador experto en juegos web con Phaser 4. Trabaja sobre mi proyecto actual e implementa un juego funcional llamado “Cholo Factos: Lima Racing”, con conducción arcade, servicios de taxi y persecuciones policiales.

No te limites a proponer un plan: revisa el proyecto, implementa, ejecuta y corrige los problemas que encuentres. Conserva las funcionalidades existentes que no estén relacionadas con el juego.

### 1. Tecnología y alcance

* Utiliza Phaser 4 y el lenguaje, herramientas y estructura existentes.
* Comprueba la versión instalada y utiliza las APIs correspondientes. No cambies de motor ni de versión principal.
* El juego debe funcionar en navegadores de computadora y celular.
* Utiliza sprites 2D con perspectiva simulada: cámara detrás del taxi y carretera que avanza hacia el jugador.
* No necesito un mundo abierto ni modelos 3D.
* Si todavía no hay una estructura de juego, crea una organización clara de carga, menú, partida, interfaz y resultados.

### 2. Imágenes disponibles

He nombrado las imágenes:

* `background`
* `obstaculos`
* `pasarejos`
* `vehiculos`
* `botones`
* `adicionales`

Busca sus extensiones y ubicaciones reales. El nombre `pasarejos` está escrito así intencionalmente: no busques únicamente “pasajeros”.

Inspecciona visualmente cada imagen antes de utilizarla. Los nombres orientan, pero debes identificar el contenido real, especialmente en `adicionales`.

Uso previsto:

* `background`: cielo, panorama de Lima y capas del escenario.
* `obstaculos`: conos, barreras, huecos, charcos y objetos recogibles.
* `pasarejos`: pasajeros esperando o levantando la mano; también puede incluir señales y patrulleros frontales.
* `vehiculos`: taxi del jugador, combi, patrulleros y tráfico.
* `botones`: controles e interfaz.
* `adicionales`: edificios, efectos u otros recursos según su contenido.

Si están presentes `inicio` y `personaje`, utiliza la primera como portada y la segunda para reacciones y diálogos.

Preparación obligatoria:

* No muestres las láminas completas como objetos del juego.
* Comprueba dimensiones y canal alfa. No elimines colores oscuros indiscriminadamente: pueden pertenecer al vehículo.
* No asumas que las hojas tienen cuadros uniformes ni frames de 256 × 256.
* Recorta los elementos correctamente y crea un atlas o una definición de frames con nombres descriptivos.
* Conserva las imágenes originales y guarda los recursos procesados por separado.
* Ajusta los puntos de apoyo para que las ruedas y bases permanezcan alineadas.
* Separa los elementos aprovechables aunque una misma imagen mezcle varias categorías.
* No reproduzcas las poses de giro como una animación continua: selecciona la pose según la dirección.
* Utiliza las secuencias de humo, sirena o salpicadura como animaciones cuando sus cuadros lo permitan.

Prioriza los recursos suministrados. Si falta un elemento secundario, crea una alternativa sencilla con gráficos del motor y deja constancia de ello.

### 3. Mecánica principal

El jugador es un taxista que recorre una Lima caricaturizada.

El ciclo de juego es:

1. Encontrar un pasajero en una zona señalizada.
2. Acercarse a la vereda y frenar para recogerlo.
3. Recibir un destino y una distancia por recorrer.
4. Conducir evitando tráfico y obstáculos.
5. Frenar en la zona de destino y cobrar.
6. Continuar con otro servicio y mayor dificultad.

Empieza con tres carriles y movimiento lateral suave. Permite conducir entre carriles; evita los saltos instantáneos.

La aceleración es automática hasta una velocidad de crucero. El jugador controla dirección, freno y turbo. Frenar debe permitir detenerse y soltar el freno debe reanudar la marcha.

### 4. Carretera y sensación de avance

Construye la carretera mediante segmentos proyectados en perspectiva:

* Estrecha en el horizonte y ancha en la parte inferior.
* Líneas de carril, bordes y bandas alternas que hagan visible el movimiento.
* Taxi cerca del centro inferior.
* Tráfico y obstáculos pequeños en la distancia, creciendo al acercarse.
* Edificios, árboles, señales y postes a ambos lados.
* Fondo lejano con desplazamiento más lento.
* Curvas suaves mediante desplazamiento progresivo de los segmentos.

No simules todo desplazando una única fotografía de carretera.

Mantén coordenadas de mundo para distancia longitudinal y posición lateral; deriva de ellas la posición y escala en pantalla. Ordena los objetos por profundidad y evita cambios bruscos de tamaño.

La velocidad debe afectar de forma coherente al avance, los objetos y la distancia al destino. Al detenerse, el mundo no debe seguir avanzando como si el taxi condujera.

### 5. Tráfico y obstáculos

Incluye los vehículos disponibles: combis, buses, mototaxis, automóviles y camiones.

Comportamientos:

* Autos con distintas velocidades.
* Combis que reducen la velocidad.
* Mototaxis que ocasionalmente cambian de carril.
* Buses que ocupan más espacio.

Anticipa los cambios de carril y evita movimientos imposibles de esquivar.

Obstáculos:

* Conos y barreras: golpe leve y pérdida de velocidad.
* Huecos y rompemuelles: penalización si se atraviesan demasiado rápido.
* Charcos: salpicadura y breve reducción de agarre.
* Escombros u objetos grandes: mayor daño.

Genera situaciones con al menos una salida razonable. No coloques obstáculos inevitables delante del jugador ni bloquees las zonas de recogida y entrega.

Calcula las colisiones usando proximidad longitudinal y solapamiento lateral en el mundo; no solamente el tamaño aparente de las imágenes.

Añade protección breve tras un impacto para evitar que un mismo choque reste vida en cada frame.

### 6. Persecución policial

Un choque con otro vehículo activa la persecución arcade. Golpear un hueco o recoger un objeto no debe activarla.

Durante la persecución:

* Aparece una alerta y un indicador de distancia respecto a la policía.
* Muestra el patrullero frontal en un retrovisor si ese recurso existe.
* Conducir rápido y sin golpes aumenta la separación.
* Chocar, detenerse o frenar demasiado permite que se acerque.
* El turbo ayuda a escapar, pero es limitado.
* Al mantener suficiente distancia durante unos segundos, termina la persecución.
* Si la policía permanece demasiado cerca durante un breve período, captura al jugador y termina la partida.

Usa estados claros: sin persecución, perseguido, escapando y capturado.

No permitas una captura instantánea al activarse la persecución.

Durante una persecución suspende la recogida y entrega de pasajeros; indica “Pierde a la policía para continuar”. Si hay un pasajero a bordo, conserva el servicio y pausa su plazo para evitar una penalización inevitable.

### 7. Pasajeros y servicios

* Coloca al pasajero fuera de la calzada.
* Marca la zona de parada con un indicador visible.
* Exige velocidad baja y permanencia breve dentro de la zona para recoger o entregar.
* No obligues al jugador a chocar con el pasajero.
* Transporta un pasajero a la vez.
* Muestra retrato, destino, distancia y tiempo disponible.
* Al recogerlo, oculta su sprite de la vereda.
* Entregar a tiempo proporciona tarifa y bonificación.
* Si vence el tiempo, pierde la bonificación, pero permite completar el servicio.

Usa destinos temáticos como Centro de Lima, La Victoria, San Isidro y Miraflores, sin prometer una reproducción geográfica exacta.

Las zonas de parada deben anunciarse con suficiente anticipación. Si el jugador pasa de largo, ofrece otra oportunidad de parada más adelante.

### 8. Vida, puntuación y Factómetro

* Vida inicial: 100.
* Los golpes reducen vida según su gravedad.
* La puntuación aumenta por distancia, servicios, adelantamientos cercanos y escapes.
* Cada adelantamiento cercano puede otorgar puntos una sola vez.
* Las monedas aumentan el dinero.
* Las reparaciones recuperan vida.
* El Factómetro se llena conduciendo bien y completando servicios.
* El turbo consume Factómetro y aumenta temporalmente la velocidad.
* El turbo no concede invulnerabilidad.

No añadas un sistema de combustible obligatorio en esta entrega; puedes reservar ese recurso para más adelante.

Guarda récord, preferencias de audio y resultados locales en localStorage. No presentes esos datos como un ranking online seguro.

### 9. Controles

Computadora:

* A/D o flechas izquierda/derecha: dirección.
* S o flecha abajo: freno.
* Espacio: turbo.
* Escape: pausa.

Celular:

* Botones grandes de izquierda y derecha.
* Freno y turbo separados.
* Soporte multitáctil para girar y frenar o acelerar simultáneamente.
* Controles dentro de las áreas seguras de pantalla.
* Evitar scroll y zoom involuntarios mientras se juega.

Limpia el estado de los controles al perder el foco, pausar o soltar una pulsación fuera del botón.

### 10. Interfaz y estilo

Conserva el estilo caricaturesco de las imágenes y la paleta roja, amarilla, negra y blanca.

Menú:

* Jugar.
* Cómo jugar.
* Sonido.

Durante la partida:

* Puntaje y dinero.
* Vida.
* Velocidad.
* Factómetro.
* Pasajero y destino cuando haya servicio.
* Distancia y tiempo restantes.
* Alerta policial únicamente durante la persecución.
* Pausa.

Los números, etiquetas y barras deben actualizarse desde código. No utilices valores pintados dentro de una imagen como información real de la partida.

Resultados:

* Puntaje.
* Distancia.
* Servicios completados.
* Dinero ganado.
* Mejor marca.
* Motivo de finalización.
* Reintentar y volver al menú.

La partida termina por vida agotada o captura. La dificultad aumenta gradualmente mediante tráfico, velocidad y obstáculos.

### 11. Efectos y sonido

Utiliza los efectos disponibles para humo, golpes, agua y turbo.

Añade una sacudida leve en impactos, balanceo del vehículo al girar y luces de frenado cuando haya poses disponibles. Los efectos no deben impedir ver la carretera.

Si existen sonidos, conecta motor, choque, sirena, cobro y botones. Si faltan, puedes crear efectos sencillos con Web Audio. Inicia el audio tras una interacción del usuario y respeta el botón de silencio.

No descargues música sin una licencia adecuada ni bloquees el desarrollo por falta de audio.

### 12. Rendimiento y organización

* Movimiento independiente de los FPS.
* Límite del delta tras regresar a una pestaña.
* Pausa al perder visibilidad.
* Reutilización de tráfico, obstáculos y efectos mediante pools.
* Límites de objetos activos.
* Limpieza de listeners, temporizadores y objetos al reiniciar.
* Configuración centralizada para velocidades, daños, recompensas y dificultad.
* Adaptación a cambios de tamaño sin deformar los sprites.

Separa la carretera, jugador, tráfico, pasajeros, persecución, interfaz y configuración en módulos comprensibles.

### 13. Validación y entrega

Implementa por etapas y continúa hasta conseguir una partida completa y jugable.

Comprueba:

* Carga correcta de imágenes y recortes.
* Vehículos apoyados visualmente sobre la carretera.
* Giros y frenado.
* Recogida y entrega de pasajeros.
* Colisiones sin daño repetido por frame.
* Inicio, escape y captura policial.
* Pausa, reinicio y pérdida de foco.
* Controles móviles simultáneos.
* Ausencia de errores en consola.
* Comandos de ejecución y compilación del proyecto.

Al terminar, informa qué implementaste, cómo ejecutarlo, qué verificaste realmente y qué limitaciones siguen pendientes.

No afirmes que está probado en dispositivos o navegadores que no hayas utilizado. No entregues solamente un diseño estático: el resultado debe permitir iniciar una partida, conducir, completar un servicio, activar una persecución y reiniciar.
