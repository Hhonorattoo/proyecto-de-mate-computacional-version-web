# FlowLab v0.7 — Ford–Fulkerson web

Aplicación educativa en **React + TypeScript + Vite** para simular Ford–Fulkerson con búsqueda en anchura (variante Edmonds–Karp), manteniendo el editor de redes, los nodos fuente/sumidero múltiples, el historial y los regresos residuales inversos de la v0.4.

> **Origen:** esta v0.6 modifica directamente la base real de v0.5 (a su vez derivada de v0.4, cuya corrección de aristas moradas fue confirmada por el usuario). El motor y el historial se mantienen; el rediseño agrega una matriz de capacidades y un lenguaje visual nuevo.

## Verificación de v0.7

Consulta `docs/VERIFICACION-v0.7.md` y `logs/` para los resultados reales, correcciones y capturas. Se incluye `package-lock.json` para reproducir las dependencias con `npm ci`.

## Ejecutar en tu equipo

Requiere **Node.js 20.19+** y npm.

```bash
npm install
npm run dev
```

Abre la dirección que indique Vite (normalmente `http://localhost:5173`). La portada es la ruta `/#/inicio` y el laboratorio `/#/laboratorio`.

Para pruebas y compilación de producción:

```bash
npm run test
npm run build
npm run preview
```

## Funcionalidades que NO deben desaparecer

- Editor interactivo de grafos dirigido: arrastrar nodos, unir conectores, agregar y eliminar nodos/aristas, editar capacidades positivas.
- Entre **7 y 16 nodos**; validación de DAG, duplicados, terminales, capacidades y camino factible.
- Múltiples fuentes y sumideros (selector por chips). Super-fuente y super-sumidero internos, sin agregarlos al editor visible.
- Ejemplo predeterminado, redes aleatorias y caso especial que fuerza el regreso residual `F → B`.
- Ford–Fulkerson/Edmonds–Karp con aristas residuales directas e inversas.
- Tres estados separados por aumento: **Etiquetado BFS → Camino encontrado → Flujo actualizado**.
- Etiquetas BFS: vértice, predecesor, signo y capacidad disponible; presentes también en el grafo.
- Camino aumentante y cuello de botella mostrados ANTES de actualizar el flujo.
- Flecha morada de arista inversa durante el camino y la actualización; historial morado conservado al finalizar, identificado como **histórico**, no como capacidad residual activa.
- Controles siguiente/anterior/inicio/fin, reproducción automática y **historial de iteraciones navegable**.
- Resultado final: flujo máximo, corte mínimo, conjuntos S y T, aristas de corte, igualdad `max-flow = min-cut`.
- Exportación/importación de sesiones JSON (con red, historial exportado y posición restaurable) y descarga de historial en CSV.
- Guardado local automático del grafo y estado del procedimiento en el mismo navegador.
- Guía con explicación del algoritmo y las etapas.

## Identidad visual (v0.6)

- **Dirección propia:** “atlas de flujo / mesa de ingeniería”. Portada grafito con tipografía clara y lima, y **diagrama vectorial de una red dirigida** como elemento central. Se eliminaron los orbes difuminados de la referencia y el gradiente de texto.
- **Coherencia visual:** portada, configurador, lienzo, historial, guía y resultados comparten la misma base negra; los estados algorítmicos usan color por significado (fuente verde agua, sumidero ámbar, flujo lima, residual inversa morada).
- **Configuración:** nueva firma de red que muestra fuentes/sumideros y nueva matriz de capacidades de n×n como complemento del editor, sin ocultar sus controles.
- **Motion** mantiene entradas y transiciones y respeta preferencias de movimiento reducido.
- **React Bits** queda configurado como registro en `components.json` para integrar componentes oficiales cuando se puedan instalar. Se retiró la imitación local de Gradient Text porque no aportaba personalidad.
- **Impeccable:** se intentó acceder al CLI, pero npm falla por DNS (`EAI_AGAIN`) en este entorno. Se aplicaron manualmente sus criterios publicados sobre gradientes, radios, contraste, tipografía y exceso de tarjetas; el registro y los pasos para ejecutar la auditoría real están en [`docs/REVISION-DISENO-IMPECCABLE.md`](docs/REVISION-DISENO-IMPECCABLE.md). **No se afirma haber ejecutado el detector.**
- `PRODUCT.md` y `DESIGN.md` preservan la definición y decisiones para futuras rondas con Impeccable/React Bits.
- No se añadieron videos ni otros recursos pesados: el nuevo diagrama se genera localmente como SVG.

## Verificaciones y limitaciones

**Ejecutadas en la revisión v0.6:**

- Compilación estricta del motor y tipos TypeScript con `tsc`.
- Ejemplo: flujo máximo **17**, corte mínimo **17**, cuatro aumentos, trece estados didácticos.
- Caso inverso: flujo máximo **10**, corte mínimo **10**, seis aumentos, diecinueve estados; detecta `F → B` y conserva el historial final.
- Múltiples fuentes y sumideros: flujo máximo = corte mínimo = **17** para la variante probada.
- Análisis sintáctico TSX de los componentes, incluyendo la portada vectorial, y análisis de CSS con `tinycss2`.
- Composición estática de portada en Chromium a 1440px, 900px y 390px sin desbordamiento horizontal; composición estática de laboratorio a 1600px sin desbordamiento horizontal. **Esto no reemplaza ejecutar React/Vite.**

**Pendiente de validar en un equipo con acceso a npm:** `npm install`, suite Vitest completa, `npm run build` y revisión visual real en navegador. En este entorno `registry.npmjs.org` no resolvió por DNS, así que **no se afirma que el build integral ni la interfaz hayan sido ejecutados aquí**.

## Publicación futura en Vercel

El archivo `vercel.json` configura Vite, comando de build `npm run build` y directorio `dist`.

1. Comprobar localmente `npm run test` y `npm run build`.
2. Subir la carpeta `ford-fulkerson-web` a un repositorio GitHub (sin `node_modules`, `dist`, `.env`).
3. En Vercel → **Add New Project** → importar repositorio; Framework **Vite**; Root Directory: la carpeta donde esté `package.json`; Build `npm run build`; Output `dist`.
4. Verificar `/#/inicio` y `/#/laboratorio` tanto en escritorio como en móvil.
5. Repetir las pruebas de historial, fuentes/sumideros y regresos morados en el dominio publicado.

Las rutas utilizan hash (`#`) para funcionar en despliegue estático sin reglas de reescritura.

## Archivos de apoyo

- [`docs/ENTREGA-SEMANA-12.md`](docs/ENTREGA-SEMANA-12.md): trazabilidad contra la rúbrica y guía de evidencias.
- [`docs/DIAGRAMA-DE-FLUJO.md`](docs/DIAGRAMA-DE-FLUJO.md): diagrama Mermaid del programa y del ciclo de aumento.
- [`docs/PRUEBAS-MANUALES.md`](docs/PRUEBAS-MANUALES.md): lista de pruebas visuales y funcionales antes de la entrega.
- [`docs/REVISION-DISENO-IMPECCABLE.md`](docs/REVISION-DISENO-IMPECCABLE.md): revisión manual con criterios publicados por Impeccable y pasos para ejecutar el detector real.
