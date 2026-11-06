import type { GraphInput } from './types'
export type CreationMode = 'manual' | 'aleatoria'
export function createGraph(count: number, mode: CreationMode): GraphInput {
  if (!Number.isInteger(count) || count < 7 || count > 16) throw new Error('Cantidad inválida')
  const nodes = Array.from({length: count}, (_, i) => ({id: String.fromCharCode(65 + i), label: String.fromCharCode(65 + i)}))
  const edges: GraphInput['edges'] = []
  if (mode === 'aleatoria') {
    for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
      if (j === i + 1 || Math.random() < .22) edges.push({id:`e${i}-${j}`,source:nodes[i].id,target:nodes[j].id,capacity:2 + Math.floor(Math.random()*14)})
    }
  }
  return {nodes, edges, sources:[nodes[0].id], sinks:[nodes[count-1].id]}
}
