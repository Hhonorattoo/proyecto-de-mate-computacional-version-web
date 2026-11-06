import type { GraphInput, SimulationStep, PathArc, BfsLabel, ReverseArcTrace, AugmentingPath } from './types'

const SUPER_SOURCE = '__SUPER_SOURCE__'
const SUPER_SINK = '__SUPER_SINK__'
type InternalEdge = { id: string; source: string; target: string; capacity: number; virtual: boolean }

export function validateGraph(graph: GraphInput): string[] {
  const errors: string[] = []
  const ids = new Set(graph.nodes.map(n => n.id))
  if (ids.size !== graph.nodes.length) errors.push('Los identificadores de nodos deben ser únicos.')
  if (graph.nodes.some(n => !n.id || n.id.startsWith('__'))) errors.push('Los identificadores vacíos o que empiezan por __ están reservados.')
  if (new Set(graph.edges.map(e => e.id)).size !== graph.edges.length) errors.push('Los identificadores de aristas deben ser únicos.')
  if (graph.edges.some(e => !e.id || e.id.startsWith('__'))) errors.push('Los identificadores de aristas vacíos o que empiezan por __ están reservados.')
  if (new Set(graph.sources).size !== graph.sources.length || new Set(graph.sinks).size !== graph.sinks.length) errors.push('No repitas fuentes ni sumideros.')
  if (!Number.isSafeInteger(graph.edges.reduce((sum, e) => sum + e.capacity, 0) + 1)) errors.push('La suma de capacidades supera el límite entero seguro.')
  if (graph.nodes.length < 7 || graph.nodes.length > 16) errors.push('La cantidad de nodos debe estar entre 7 y 16.')
  if (!graph.sources.length) errors.push('Selecciona al menos una fuente.')
  if (!graph.sinks.length) errors.push('Selecciona al menos un sumidero.')
  if (graph.sources.some(id => !ids.has(id))) errors.push('Hay una fuente que no pertenece a la red.')
  if (graph.sinks.some(id => !ids.has(id))) errors.push('Hay un sumidero que no pertenece a la red.')
  if (graph.sources.some(id => graph.sinks.includes(id))) errors.push('Un vértice no puede ser fuente y sumidero simultáneamente.')
  const seen = new Set<string>()
  for (const edge of graph.edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) errors.push(`La arista ${edge.id} contiene un nodo inexistente.`)
    if (edge.source === edge.target) errors.push(`La arista ${edge.id} no puede conectar un nodo consigo mismo.`)
    if (!Number.isSafeInteger(edge.capacity) || edge.capacity <= 0) errors.push(`La capacidad de ${edge.id} debe ser un entero positivo.`)
    const key = `${edge.source}->${edge.target}`
    if (seen.has(key)) errors.push(`La conexión ${key} está duplicada.`)
    seen.add(key)
  }
  const adjacency = new Map(graph.nodes.map(n => [n.id, [] as string[]]))
  graph.edges.forEach(e => adjacency.get(e.source)?.push(e.target))
  const color = new Map<string, number>()
  const visit = (u: string): boolean => {
    color.set(u, 1)
    for (const v of adjacency.get(u) ?? []) {
      if (color.get(v) === 1) return true
      if (!color.has(v) && visit(v)) return true
    }
    color.set(u, 2)
    return false
  }
  for (const node of graph.nodes) if (!color.has(node.id) && visit(node.id)) {
    errors.push('La red contiene al menos un ciclo dirigido. Corrige las conexiones antes de continuar.')
    break
  }
  if (!errors.length && !hasAnyTerminalPath(graph)) errors.push('No existe un camino desde ninguna fuente hasta ningún sumidero.')
  return [...new Set(errors)]
}

function hasAnyTerminalPath(graph: GraphInput): boolean {
  const adjacency = new Map<string, string[]>()
  graph.edges.forEach(e => adjacency.set(e.source, [...(adjacency.get(e.source) ?? []), e.target]))
  for (const source of graph.sources) {
    const seen = new Set([source]), queue = [source]
    while (queue.length) {
      const u = queue.shift()!
      if (graph.sinks.includes(u)) return true
      for (const v of adjacency.get(u) ?? []) if (!seen.has(v)) { seen.add(v); queue.push(v) }
    }
  }
  return false
}

/** Ford-Fulkerson with BFS labeling (Edmonds-Karp), including reverse residual arcs. */
export function buildSimulation(graph: GraphInput): SimulationStep[] {
  const errors = validateGraph(graph)
  if (errors.length) throw new Error(errors.join(' '))

  // Virtual super-source/sink reproduce the original Python program's multi-terminal behavior.
  // Their capacity is safely bounded by the sum of all original capacities, not an arbitrary 99999.
  const virtualCapacity = graph.edges.reduce((sum, edge) => sum + edge.capacity, 0) + 1
  const internalEdges: InternalEdge[] = [
    ...graph.edges.map(e => ({ ...e, virtual: false })),
    ...graph.sources.map((id, i) => ({ id: `__VIRTUAL__S_${i}`, source: SUPER_SOURCE, target: id, capacity: virtualCapacity, virtual: true })),
    ...graph.sinks.map((id, i) => ({ id: `__VIRTUAL__T_${i}`, source: id, target: SUPER_SINK, capacity: virtualCapacity, virtual: true })),
  ]
  const flows: Record<string, number> = Object.fromEntries(internalEdges.map(e => [e.id, 0]))
  const steps: SimulationStep[] = []
  let totalFlow = 0
  let iteration = 0
  const reverseHistory: ReverseArcTrace[] = []
  const snapshot = () => ({
    flows: Object.fromEntries(graph.edges.map(e => [e.id, flows[e.id]])),
    residuals: Object.fromEntries(graph.edges.map(e => [e.id, e.capacity - flows[e.id]])),
  })

  while (true) {
    const residualArcs: PathArc[] = []
    for (const edge of internalEdges) {
      const forward = edge.capacity - flows[edge.id]
      if (forward > 0) residualArcs.push({
        edgeId: edge.id, direction: 1, from: edge.source, to: edge.target,
        virtual: edge.virtual, residualCapacity: forward,
      })
      if (flows[edge.id] > 0) residualArcs.push({
        edgeId: edge.id, direction: -1, from: edge.target, to: edge.source,
        virtual: edge.virtual, residualCapacity: flows[edge.id],
      })
    }

    // Etiquetado BFS: se conservan orden, predecesor, signo y capacidad disponible.
    const queue = [SUPER_SOURCE]
    const parent = new Map<string, { previous: string; arc: PathArc; capacity: number }>()
    const visited = new Set([SUPER_SOURCE])
    const labels: BfsLabel[] = []
    while (queue.length && !visited.has(SUPER_SINK)) {
      const u = queue.shift()!
      for (const arc of residualArcs) {
        if (arc.from !== u || arc.residualCapacity <= 0 || visited.has(arc.to)) continue
        visited.add(arc.to)
        const upstream = parent.get(u)?.capacity ?? Number.POSITIVE_INFINITY
        const available = Math.min(upstream, arc.residualCapacity)
        parent.set(arc.to, { previous: u, arc, capacity: available })
        queue.push(arc.to)
        if (arc.to !== SUPER_SINK) labels.push({
          node: arc.to,
          predecessor: u === SUPER_SOURCE ? null : u,
          sign: u === SUPER_SOURCE ? 'S' : arc.direction === 1 ? '+' : '-',
          available,
          viaEdgeId: arc.virtual ? null : arc.edgeId,
          order: labels.length + 1,
        })
        if (arc.to === SUPER_SINK) break
      }
    }

    if (!visited.has(SUPER_SINK)) {
      const reachable = [...visited].filter(id => !id.startsWith('__'))
      const reachableSet = new Set(reachable)
      const cutEdges = graph.edges.filter(e => reachableSet.has(e.source) && !reachableSet.has(e.target)).map(e => e.id)
      const cutCapacity = graph.edges.filter(e => cutEdges.includes(e.id)).reduce((sum, e) => sum + e.capacity, 0)
      steps.push({
        iteration, phase: 'FINAL', path: null, reverseHistory: [...reverseHistory], bfsLabels: labels,
        totalFlow, ...snapshot(), finished: true, reachable, cutEdges, cutCapacity,
        explanation: 'BFS ya no llega al sumidero por la red residual. El flujo alcanzado es máximo y su valor coincide con la capacidad del corte mínimo.',
      })
      break
    }

    const pathNodes = [SUPER_SINK]
    const pathArcs: PathArc[] = []
    let cursor = SUPER_SINK
    while (cursor !== SUPER_SOURCE) {
      const p = parent.get(cursor)!
      pathArcs.unshift(p.arc)
      cursor = p.previous
      pathNodes.unshift(cursor)
    }
    const bottleneck = Math.min(...pathArcs.map(arc => arc.residualCapacity))
    const visibleArcs = pathArcs.filter(arc => !arc.virtual)
    const visibleNodes = pathNodes.filter(id => !id.startsWith('__'))
    const path: AugmentingPath = {
      nodes: visibleNodes, edgeIds: visibleArcs.map(a => a.edgeId), arcs: visibleArcs, bottleneck,
    }
    const hasReverse = visibleArcs.some(arc => arc.direction === -1)
    const nextIteration = iteration + 1
    const before = snapshot()
    const unchanged = { finished: false, reachable: [] as string[], cutEdges: [] as string[], cutCapacity: 0 }

    steps.push({
      iteration: nextIteration, phase: 'BUSQUEDA_BFS', path: null,
      reverseHistory: [...reverseHistory], bfsLabels: labels, totalFlow,
      ...before, ...unchanged,
      explanation: `BFS etiquetó ${labels.length} vértices; cada etiqueta indica el predecesor, el sentido del arco y la capacidad residual acumulada.`,
    })
    steps.push({
      iteration: nextIteration, phase: 'CAMINO_ENCONTRADO', path,
      reverseHistory: [...reverseHistory], bfsLabels: labels, totalFlow,
      ...before, ...unchanged,
      explanation: `Camino aumentante identificado. El cuello de botella es ${bottleneck}, la menor capacidad residual de su recorrido.${hasReverse ? ' La ruta incluye una arista inversa, que cancelará flujo anterior.' : ''}`,
    })

    for (const arc of pathArcs) flows[arc.edgeId] += arc.direction * bottleneck
    totalFlow += bottleneck
    iteration = nextIteration
    for (const arc of visibleArcs.filter(a => a.direction === -1)) {
      reverseHistory.push({ arc: { ...arc }, bottleneck, iteration })
    }
    steps.push({
      iteration, phase: 'FLUJO_ACTUALIZADO', path,
      reverseHistory: [...reverseHistory], bfsLabels: labels, totalFlow,
      ...snapshot(), ...unchanged,
      explanation: hasReverse
        ? `Flujo aumentado en ${bottleneck}. Los arcos directos suman flujo y los inversos restan flujo previo; el regreso se registra en el historial.`
        : `Flujo aumentado en ${bottleneck} en todas las aristas directas del camino. El acumulado es ${totalFlow}.`,
    })
  }
  return steps
}
