import type { GraphInput, PathArc } from './types'

export type ResidualRow = {
  id: string; source: string; target: string; capacity: number;
  flow: number; forward: number; inverse: number; virtual: boolean;
}

/** Red residual de una instantánea, incluidos los terminales ficticios visibles. */
export function residualNetwork(graph: GraphInput, flows: Record<string, number>) {
  const rows: ResidualRow[] = graph.edges.map(edge => {
    const flow = flows[edge.id] ?? 0
    return {...edge, flow, forward: edge.capacity - flow, inverse: flow, virtual: false}
  })
  const capacity = graph.edges.reduce((sum, edge) => sum + edge.capacity, 0) + 1
  for (const kind of ['sources', 'sinks'] as const) {
    if (graph[kind].length < 2) continue
    for (const id of graph[kind]) {
      const balance = graph.edges.reduce((sum, edge) => sum + (edge.source === id ? flows[edge.id] ?? 0 : 0) - (edge.target === id ? flows[edge.id] ?? 0 : 0), 0)
      const source = kind === 'sources'
      const flow = source ? balance : -balance
      rows.push({id:`virtual-${id}-${kind}`, source:source ? '__SUPER_SOURCE__' : id, target:source ? id : '__SUPER_SINK__', capacity, flow, forward:capacity-flow, inverse:flow, virtual:true})
    }
  }
  const arcs: PathArc[] = rows.flatMap(row => [
    ...(row.forward > 0 ? [{edgeId:row.id, from:row.source, to:row.target, direction:1 as const, residualCapacity:row.forward, virtual:row.virtual}] : []),
    ...(row.inverse > 0 ? [{edgeId:row.id, from:row.target, to:row.source, direction:-1 as const, residualCapacity:row.inverse, virtual:row.virtual}] : []),
  ])
  return {rows, arcs}
}
