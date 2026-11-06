import type { GraphInput } from '../engine/types'

/** Red de demostración diseñada para forzar el uso de una arista residual inversa. */
export const reverseResidualExample: GraphInput = {
  nodes: 'ABCDEFG'.split('').map(id => ({ id, label: id })),
  sources: ['A'],
  sinks: ['G'],
  edges: [
    { id: 'e0', source: 'A', target: 'B', capacity: 2 },
    { id: 'e1', source: 'A', target: 'C', capacity: 3 },
    { id: 'e2', source: 'A', target: 'D', capacity: 2 },
    { id: 'e3', source: 'A', target: 'F', capacity: 1 },
    { id: 'e4', source: 'A', target: 'G', capacity: 3 },
    { id: 'e5', source: 'B', target: 'C', capacity: 3 },
    { id: 'e6', source: 'B', target: 'F', capacity: 1 },
    { id: 'e7', source: 'B', target: 'G', capacity: 1 },
    { id: 'e8', source: 'C', target: 'E', capacity: 1 },
    { id: 'e9', source: 'C', target: 'F', capacity: 1 },
    { id: 'e10', source: 'C', target: 'G', capacity: 3 },
    { id: 'e11', source: 'D', target: 'F', capacity: 2 },
    { id: 'e12', source: 'E', target: 'G', capacity: 3 },
    { id: 'e13', source: 'F', target: 'G', capacity: 2 },
  ],
}
