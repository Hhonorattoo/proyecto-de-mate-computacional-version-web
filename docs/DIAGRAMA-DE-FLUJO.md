# Diagrama de flujo de FlowLab

Corresponde al motor de `src/engine/fordFulkerson.ts`, su integración en `src/App.tsx` y el procedimiento Ford–Fulkerson con etiquetado BFS.

```mermaid
flowchart TD
    A[Entrar a FlowLab] --> B[Crear, importar o generar una red]
    B --> C{¿Red válida?}
    C -- No --> D[Mostrar errores de nodos, aristas, DAG o terminales]
    D --> B
    C -- Sí --> E[Inicializar flujos a cero]
    E --> F[Agregar superfuente y supersumidero internos]
    F --> G[Construir red residual con arcos directos e inversos]
    G --> H[Ejecutar BFS y registrar etiquetas]
    H --> I{¿Llega al supersumidero?}
    I -- Sí --> J[Mostrar búsqueda y árbol de etiquetas]
    J --> K[Reconstruir camino aumentante]
    K --> L[Calcular cuello de botella mínimo]
    L --> M[Mostrar camino antes de modificar flujos]
    M --> N[Sumar flujo en arcos directos y restarlo en inversos]
    N --> O[Guardar iteración, historial y regresos morados]
    O --> G
    I -- No --> P[Calcular alcanzables S y complemento T]
    P --> Q[Marcar aristas del corte mínimo y sumar capacidades]
    Q --> R[Comprobar flujo máximo = capacidad del corte]
    R --> S[Mostrar resultado final e historial navegable]
    S --> T[Exportar JSON y CSV si el usuario lo desea]
```

**Estados de la interfaz por iteración:** `BUSQUEDA_BFS`, `CAMINO_ENCONTRADO`, `FLUJO_ACTUALIZADO`. El último estado es `FINAL`. Cada estado es una instantánea de flujo, residual, etiquetas y recorrido; así el usuario puede avanzar y retroceder sin alterar el resultado matemático.

**Nodos ficticios:** se crean solo en el motor para fuentes/sumideros múltiples. No forman parte de la red editable; su capacidad supera la suma de las capacidades originales para que no restrinjan el máximo.
