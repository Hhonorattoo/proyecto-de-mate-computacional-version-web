# Comparación v0.4 → v0.5

| Elemento | v0.4 | v0.5 |
| --- | --- | --- |
| Portada | Hero pequeño encima del laboratorio | Portada independiente, blanca, con gran tipografía, gradientes y botón de entrada |
| Laboratorio | Panel oscuro de dos columnas | Estudio de contraste alto con lienzo oscuro y herramientas/resultados en tarjetas claras |
| Fuentes y sumideros | Selectores múltiples con Ctrl/Cmd | Chips de selección directa, compatibles con varias fuentes y sumideros |
| Editor | Agregar nodos/aristas, quitar aristas | Se conservan y se añade quitar nodos y editar capacidad de cada arista |
| Movimiento de nodos | Estado de nodos derivado de un arreglo estático | `useNodesState` mantiene la posición al arrastrar y avanzar simulación |
| Motor | Un estado por camino aumentado | Tres estados explicativos por aumento, más el estado final |
| Etiquetas BFS | Existían internamente, pero no se mostraban | Predecesor, signo, capacidad y orden de visita en el motor; etiqueta visible en grafo y panel |
| Aristas moradas | Curva inversa durante la iteración y recuerdo final | Mismo comportamiento conservado y contrastado; capas y leyenda actualizadas |
| Historial | Navegación de estados con botones | Lista completa clicable por iteración + botones + reproducción automática |
| Resultado | Flujo/corte y conjuntos | Se preservan con panel propio, aristas de corte y explicación del historial inverso |
| Sesión | Estado solo en memoria | Persistencia local y exportación/importación JSON con posición restaurable, historial CSV |
| Responsive | Básico | Layout de 3/2/1 columnas y menú de herramientas móvil |
| Diseño | Oscuro general | Portada clara, laboratorio híbrido con Motion y gradientes estilo React Bits |
| Publicación | Manual | Configuración Vercel y documentación de despliegue |

El cambio de la cantidad de estados (de una instantánea por aumento a tres) **no altera la matemática del flujo**. Los tests del motor y la verificación contra NetworkX se aplican al nuevo motor.
