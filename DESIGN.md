# FlowLab — sistema visual v0.6

## Dirección

**Atlas de flujo / mesa de trabajo de ingeniería.** Fondo negro grafito continuo en portada, editor, configuración y análisis. El grafo no debe parecer una pantalla injertada dentro de una interfaz distinta. Sin círculos difuminados en esquinas, gradientes de texto ni tarjetas genéricas apiladas por decoración.

## Paleta semántica

| Token | Valor | Propósito |
| --- | --- | --- |
| Fondo | `#090d0e` | superficie continua |
| Panel | `#111718` | configuración/análisis |
| Panel elevado | `#172021` | inputs y superficies anidadas necesarias |
| Bordes | `#2a3736` | divisiones sobrias |
| Texto | `#ecf1e9` | lectura |
| Texto secundario | `#adbab3` | explicación |
| Acento | `#daf77f` | llamadas a la acción, flujo destacado y elementos de marca |
| Fuente | `#65d9b8` | nodo origen |
| Sumidero | `#f7ba79` | nodo destino |
| Regreso residual | `#df9bfa` | arista inversa (su color no debe cambiarse por estética) |

## Tipografía y composición

- `Space Grotesk`: títulos y lectura principal. `IBM Plex Mono`: etiquetas técnicas, estados, cifras compactas y coordenadas.
- Controles de altura ~40–44 px como mínimo; lectura secundaria de 12–14 px; microetiquetas mono de 10–11 px.
- Portada con titular editorial a la izquierda y diagrama original de topología dirigido a la derecha. No copiar ilustraciones de la referencia.
- En laboratorio, columna izquierda = modelado, centro = grafo, derecha = simulación/historial. La división responde al flujo de trabajo, no a una cuadrícula de tarjetas decorativas.
- Radios contenidos (5–9 px); evitar sombras flotantes y texturas de neón.

## Comportamientos

- Motion solo para entradas y actualizaciones con propósito; respetar `prefers-reduced-motion`.
- Las trayectorias inversas se representan en morado y con una etiqueta que distingue uso actual de historial.
- La portada es una ilustración educativa **decorativa**, no un ejemplo numérico calculado. Se declara `aria-hidden`.
- La nueva matriz de capacidades es una vista adicional, nunca un sustituto del editor de aristas.
- Todas las acciones importantes deben funcionar con teclado; los controles de edición expuestos deben ser botones o inputs semánticos.
