import type { GraphInput } from '../engine/types'

export const exampleGraph: GraphInput = {
  nodes: ['A','B','C','D','E','F','G'].map(id => ({ id, label: id })),
  edges: [
    { id: 'e1', source: 'A', target: 'B', capacity: 10 },
    { id: 'e2', source: 'A', target: 'C', capacity: 8 },
    { id: 'e3', source: 'B', target: 'D', capacity: 5 },
    { id: 'e4', source: 'B', target: 'E', capacity: 5 },
    { id: 'e5', source: 'C', target: 'D', capacity: 3 },
    { id: 'e6', source: 'C', target: 'F', capacity: 5 },
    { id: 'e7', source: 'D', target: 'G', capacity: 8 },
    { id: 'e8', source: 'E', target: 'G', capacity: 4 },
    { id: 'e9', source: 'F', target: 'G', capacity: 6 },
  ],
  sources: ['A'],
  sinks: ['G'],
}
