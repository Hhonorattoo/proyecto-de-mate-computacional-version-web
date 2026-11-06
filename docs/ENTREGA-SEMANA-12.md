# Matriz de la rúbrica — segunda entrega, Semana 12

**Fuente:** «Rúbrica para la sustentación de proyectos (12 puntos) – Semana 12», página 2 del PDF aportado por el usuario. La primera revisión (Semana 6) ya fue presentada y el usuario recibió 8/8.

| Criterio | Evidencia en la aplicación | Evidencia que debe acompañar el informe/PPT |
| --- | --- | --- |
| Observaciones y presentación (2 puntos) | Se mantiene la funcionalidad de v0.4 y se agrega la interfaz web. | Informe con **Introducción, Objetivo, Metodología, Desarrollo del Código, Diagrama de Flujo, Resultados y Conclusiones**, en formato establecido. |
| Desarrollo del código y diagrama (2 puntos) | Motor TS independiente de React, editor React Flow, pantallas y módulos identificados. | Describir React, TypeScript, Vite, React Flow, Motion y algoritmo; incluir fragmentos relevantes y figuras con número, título y nota en formato APA. Utilizar `DIAGRAMA-DE-FLUJO.md` y ajustarlo si cambia el programa. |
| Resultados y conclusiones (2 puntos) | Panel con flujo máximo, corte mínimo, conjuntos S/T, aristas de corte, historia y exportación. | Interpretar resultados de un ejemplo y un caso residual inverso; explicar si se cumple el objetivo general, documentar evidencias y conclusiones relacionadas. |
| Sustentación (2 puntos) | Portada y laboratorio diseñados para demostración. | Participación puntual de todo el equipo, vestimenta formal, presentación clara y dominio del proyecto; PPT preparado por el equipo. |
| Programa ejecutable (4 puntos) | Editor, fuentes/sumideros múltiples, ejecución completa, fases BFS separadas, regresos, historia, corte mínimo. | Probar ejecución real en el equipo y en Vercel, mostrar paso a paso y resultado final, incluir capturas. |

## Casos de demostración sugeridos

1. **Red inicial (A→G):** cuatro aumentos, flujo máximo = corte mínimo = **17**.
2. **Regreso inverso (F→B):** seis aumentos, flujo máximo = corte mínimo = **10**. En «Camino encontrado» y «Flujo actualizado» aparece la arista morada; en «Final» queda como historial **histórico**.
3. **Múltiples terminales:** seleccionar A y B como fuentes, F y G como sumideros en el ejemplo. Se utilizan superfuente y supersumidero internos.
4. **Red inválida:** generar un ciclo o una capacidad no positiva y observar el mensaje de validación sin ejecutar el algoritmo.
5. **Persistencia:** exportar sesión, importar JSON y recuperar una etapa; exportar historial CSV.

**No confundir:** que la aplicación muestre estas evidencias no sustituye los apartados ni figuras del **informe** exigidos por la rúbrica, ni reemplaza la preparación de una exposición.
