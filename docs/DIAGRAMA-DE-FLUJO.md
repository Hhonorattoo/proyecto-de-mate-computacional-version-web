# Flujo de Flow Fulkerson 1.0

El motor calcula instantáneas al iniciar; la interfaz permite reproducirlas y retroceder. Se separa ese cálculo del recorrido visible.

```mermaid
flowchart TD
    A[Portada] --> B[Elegir n entre 7 y 16 y modo]
    B --> C[Crear red vacía manual o DAG aleatorio]
    C --> D[Seleccionar fuentes y sumideros]
    D --> E[Mostrar S* y T* si hay múltiples terminales]
    E --> F{Red válida}
    F -- No --> G[Informar errores y corregir]
    G --> C
    F -- Sí: iniciar --> H[Motor: flujos cero y arcos virtuales internos]
    H --> I[Construir arcos residuales positivos]
    I --> J[BFS y predecesores]
    J --> K{Existe camino aumentante}
    K -- Sí --> L[Guardar instantánea de búsqueda]
    L --> M[Reconstruir camino y mínimo residual]
    M --> N[Guardar camino antes de actualizar]
    N --> O[Sumar directos y restar inversos]
    O --> P[Guardar actualización e historial]
    P --> I
    K -- No --> Q[Alcanzables S, complemento T y corte]
    Q --> R[Guardar estado final]
    R --> U[Interfaz: reproducir instantáneas desde primera fase]
    U --> V[Historial, flujo y selector de red residual]
    V --> W{Última instantánea}
    W -- No --> X[Avanzar, retroceder o reproducir]
    X --> V
    W -- Sí --> Y[Botón Ver resultado final]
    Y --> Z[Resultado, corte, flujos y caminos]
    Z --> AA[Volver a simulación o descargar CSV]
```

Cada instantánea conserva flujo y capacidades. La red residual visible deriva c−f y f de esa instantánea; la tabla incluye ceros y el grafo solo capacidades positivas. El cálculo de capacidades de corte se contrasta con el flujo máximo en tests; el motor no delega su resolución a una biblioteca de flujo máximo.
