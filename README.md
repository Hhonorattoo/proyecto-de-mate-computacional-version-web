# Flow Fulkerson 1.0

Simulador académico web de Ford–Fulkerson con BFS (Edmonds–Karp). Identidad azul/celeste/morada y Paytone One autoalojada para la marca.

**Web:** https://flow-fulkerson.vercel.app/

## Ejecutar

Node.js 20.19+ y npm:

```sh
npm ci
npm run dev
npm run test
npm run build
npm run preview
```

Vercel publica `dist` al actualizar main del repositorio web. El repositorio Python original es independiente y no se modifica.

## Recorrido

1. Configurar n entero entre 7 y 16 y modo manual o automático.
2. Construir conexiones/capacidades en manual o explorar la red automática. Elegir múltiples fuentes/sumideros; S*/T* aparecen cuando corresponda. Matriz plegada por defecto. Las redes inválidas bloquean inicio.
3. Simular con historial izquierdo, grafo central y controles derechos. El botón celeste avanza una fase; reproducción automática y navegación anterior disponibles. Los nodos conservan su posición entre pantallas.
4. Consultar el resultado con flujo máximo, corte mínimo resaltado, conjuntos S/T, capacidad de corte, asignación de flujo por arista y caminos aumentantes.

## Red residual completa

En simulación y resultado, el selector Red residual muestra todos los arcos disponibles de la instantánea: directos con c−f>0 e inversos con f>0 (morados y curvos). Los ceros se omiten del dibujo y permanecen en la tabla plegable de capacidades residuales. Se incluyen los arcos de S*/T* cuando hay múltiples terminales.

La vista Flujo / capacidad conserva las aristas originales, los caminos y el rastro histórico de regresos, rotulado como histórico; la vista residual representa disponibilidad actual. No se confunden ambas.

## Comprobaciones y documentación

15 tests correctos: motor, comparación de 30 DAG con enumeración de cortes, generación 7–16, red residual por fases, inversas disponibles sin historial previo, cancelación F→B y balance de terminales ficticios. Ver `docs/VERIFICACION-1.0.md` y `logs/1.0/`.

Paytone One y su licencia SIL OFL están en `public/fonts/`. Barlow e IBM Plex Mono se mantienen para lectura y datos. La revisión Impeccable no sustituye una certificación WCAG completa.

El informe y PPT del equipo requieren revisión independiente. Las notas de versiones antiguas se conservan como antecedentes; no representan las funciones actuales (JSON y carga de ejemplos se retiraron por decisión del usuario).
