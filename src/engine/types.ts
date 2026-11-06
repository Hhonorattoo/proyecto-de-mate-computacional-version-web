export type GraphNode = { id: string; label: string }
export type GraphEdge = { id: string; source: string; target: string; capacity: number }
export type GraphInput = { nodes: GraphNode[]; edges: GraphEdge[]; sources: string[]; sinks: string[] }
export type PathArc = { edgeId: string; direction: 1 | -1; from: string; to: string; virtual: boolean; residualCapacity: number }
export type AugmentingPath = { nodes: string[]; edgeIds: string[]; arcs: PathArc[]; bottleneck: number }
export type ReverseArcTrace = { arc: PathArc; bottleneck: number; iteration: number }
export type BfsLabel = {
  node: string
  predecessor: string | null
  sign: '+' | '-' | 'S'
  available: number
  viaEdgeId: string | null
  order: number
}
export type SimulationPhase = 'BUSQUEDA_BFS' | 'CAMINO_ENCONTRADO' | 'FLUJO_ACTUALIZADO' | 'FINAL'
export type SimulationStep = {
  iteration: number
  phase: SimulationPhase
  path: AugmentingPath | null
  /** Las cancelaciones permanecen registradas incluso en la pantalla final. */
  reverseHistory: ReverseArcTrace[]
  /** Etiquetas de BFS del estado residual antes de aumentar el flujo. */
  bfsLabels: BfsLabel[]
  totalFlow: number
  flows: Record<string, number>
  residuals: Record<string, number>
  explanation: string
  finished: boolean
  reachable: string[]
  cutEdges: string[]
  cutCapacity: number
}
