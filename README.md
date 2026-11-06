# FlowLab v0.8 — Laboratorio de flujo máximo

Simulador web de Ford–Fulkerson con búsqueda BFS (Edmonds–Karp), React y TypeScript.

## Uso

1. Entra al laboratorio desde la portada.
2. Indica la cantidad exacta de nodos (7–16) y elige Manual o Automática.
3. En Manual, la red comienza sin aristas: conecta vértices y asigna capacidades. En Automática, la red ya está generada y las conexiones se consultan sin editar.
4. Selecciona fuentes y sumideros por clic; recorre las fases y el historial hasta el flujo máximo y el corte mínimo.
5. Usa Volver a configurar para cambiar cantidad o modo. Crear red inicia una red nueva.

El motor conserva los arcos inversos, validación de ciclos, múltiples terminales y corte mínimo. Se retiraron de la interfaz importar/exportar JSON, guardar sesión, cargar el ejemplo inverso y restablecer el ejemplo. Se conserva la descarga CSV del historial. La vista residual completa queda fuera de este cambio.

## Desarrollo

Node.js 20.19+ y npm:

```sh
npm ci
npm run dev
npm run test
npm run build
```

Vercel compila con `npm run build` y publica `dist`. La rama main del repositorio web activa el despliegue automático. El repositorio original de Python no se modifica.

## Comprobaciones de v0.8

- 11 tests: incluye generación manual/automática para todo el rango 7–16 y rechazo de cantidades inválidas, además del motor y 30 redes contrastadas con cortes enumerados.
- Navegador local: manual de 8 nodos, creación A→H y flujo 5; automática de 16 nodos, editor ausente y simulación final; sin errores de consola en la consulta realizada.
- Logs anteriores de v0.7 se conservan con su contexto histórico. El informe académico y el PPT no forman parte de esta actualización.
