import { describe, expect, it } from 'vitest'
import { buildSimulation, validateGraph } from './fordFulkerson'
import type { GraphInput } from './types'
import { exampleGraph } from '../data/example'

const reverseResidualGraph: GraphInput = {
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

describe('Ford-Fulkerson con búsqueda BFS', () => {
  it('calcula el flujo máximo y verifica el teorema flujo máximo-corte mínimo', () => {
    const final = buildSimulation(exampleGraph).at(-1)!
    expect(final.finished).toBe(true)
    expect(final.totalFlow).toBe(17)
    expect(final.cutCapacity).toBe(17)
  })

  it('admite varias fuentes y varios sumideros', () => {
    const graph = { ...exampleGraph, sources: ['A', 'B'], sinks: ['F', 'G'] }
    const final = buildSimulation(graph).at(-1)!
    expect(final.totalFlow).toBe(17)
    expect(final.cutCapacity).toBe(final.totalFlow)
  })

  it('encuentra y registra aristas residuales inversas', () => {
    const steps = buildSimulation(reverseResidualGraph)
    const reverseStep = steps.find(step => step.path?.arcs.some(arc => arc.direction === -1))!
    const reverseArc = reverseStep.path!.arcs.find(arc => arc.direction === -1)!
    expect(reverseArc.from).toBe('F')
    expect(reverseArc.to).toBe('B')
    expect(reverseArc.residualCapacity).toBe(1)
    expect(reverseStep.path!.bottleneck).toBe(1)
    expect(steps.at(-1)!.totalFlow).toBe(10)
    expect(steps.at(-1)!.cutCapacity).toBe(10)
    // La vista final conserva el rastro de la arista inversa utilizada.
    expect(steps.at(-1)!.reverseHistory).toHaveLength(1)
    expect(steps.at(-1)!.reverseHistory[0].arc.from).toBe('F')
    expect(steps.at(-1)!.reverseHistory[0].arc.to).toBe('B')
  })

  it('rechaza redes con ciclos dirigidos', () => {
    const graph = {
      ...exampleGraph,
      edges: [...exampleGraph.edges, { id: 'cycle', source: 'G', target: 'A', capacity: 1 }],
    }
    expect(validateGraph(graph).join(' ')).toContain('ciclo dirigido')
  })
})

describe('Estados didácticos e historial de v0.5', () => {
  it('separa las fases de BFS, camino encontrado y actualización sin modificar la solución', () => {
    const steps = buildSimulation(exampleGraph)
    const first = steps.slice(0, 3)
    expect(first.map(step => step.phase)).toEqual(['BUSQUEDA_BFS', 'CAMINO_ENCONTRADO', 'FLUJO_ACTUALIZADO'])
    expect(first[0].totalFlow).toBe(0)
    expect(first[1].totalFlow).toBe(0)
    expect(first[2].totalFlow).toBe(first[1].path!.bottleneck)
    expect(first[0].bfsLabels.length).toBeGreaterThan(0)
    expect(first[0].bfsLabels.some(label => label.node === 'G')).toBe(true)
    const final = steps.at(-1)!
    expect(final.phase).toBe('FINAL')
    expect(final.totalFlow).toBe(17)
    expect(final.cutCapacity).toBe(17)
  })

  it('muestra el regreso inverso antes de actualizar el flujo y conserva su historial al terminar', () => {
    const steps = buildSimulation(reverseResidualGraph)
    const discovery = steps.find(step => step.phase === 'CAMINO_ENCONTRADO' && step.path?.arcs.some(a => a.direction === -1))!
    const update = steps.find(step => step.phase === 'FLUJO_ACTUALIZADO' && step.iteration === discovery.iteration)!
    const reverseEdge = discovery.path!.arcs.find(arc => arc.direction === -1)!
    expect(reverseEdge.from).toBe('F')
    expect(reverseEdge.to).toBe('B')
    expect(discovery.flows[reverseEdge.edgeId] - update.flows[reverseEdge.edgeId]).toBe(discovery.path!.bottleneck)
    expect(update.reverseHistory).toHaveLength(1)
    expect(steps.at(-1)!.reverseHistory).toHaveLength(1)
  })
})


describe('Integridad de redes importadas', () => {
  it('rechaza identificadores internos, duplicados y terminales repetidos', () => {
    expect(validateGraph({...exampleGraph, nodes: exampleGraph.nodes.map((n, i) => i === 0 ? {...n, id: '__SUPER_SOURCE__'} : n)}).join(' ')).toContain('reservados')
    expect(validateGraph({...exampleGraph, edges: [...exampleGraph.edges, {...exampleGraph.edges[0], target: 'G'}]}).join(' ')).toContain('únicos')
    expect(validateGraph({...exampleGraph, sources: ['A', 'A']}).join(' ')).toContain('No repitas')
  })
  it('rechaza capacidades y sumas que perderían precisión', () => {
    for (const capacity of [Infinity, NaN, 1.5, 0, -1, Number.MAX_SAFE_INTEGER]) {
      const graph = {...exampleGraph, edges: exampleGraph.edges.map((e, i) => i === 0 ? {...e, capacity} : e)}
      expect(validateGraph(graph).length).toBeGreaterThan(0)
      expect(() => buildSimulation(graph)).toThrow()
    }
  })
})


describe('Oráculo independiente de corte mínimo', () => {
  it('compara 30 redes DAG con todos los cortes y comprueba conservación', () => {
    let seed = 1212
    const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
    for (let trial = 0; trial < 30; trial++) {
      const nodes = 'ABCDEFG'.split('').map(id => ({id, label:id}))
      const edges: GraphInput['edges'] = []
      for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) {
        if (j === i + 1 || random() < .4) edges.push({id:`e${i}-${j}`, source:nodes[i].id, target:nodes[j].id, capacity:1 + Math.floor(random()*20)})
      }
      const graph = {nodes, edges, sources: trial % 2 ? ['A', 'B'] : ['A'], sinks: trial % 3 ? ['G'] : ['F', 'G']}
      let minimum = Infinity
      for (let mask = 0; mask < 128; mask++) {
        const inside = new Set(nodes.filter((_, i) => mask & (1 << i)).map(n => n.id))
        if (!graph.sources.every(id => inside.has(id)) || graph.sinks.some(id => inside.has(id))) continue
        minimum = Math.min(minimum, edges.filter(e => inside.has(e.source) && !inside.has(e.target)).reduce((sum,e) => sum + e.capacity,0))
      }
      const final = buildSimulation(graph).at(-1)!
      expect(final.totalFlow).toBe(minimum)
      expect(final.cutCapacity).toBe(minimum)
      for (const edge of edges) {
        expect(final.flows[edge.id]).toBeGreaterThanOrEqual(0)
        expect(final.flows[edge.id]).toBeLessThanOrEqual(edge.capacity)
      }
      for (const node of nodes.filter(n => !graph.sources.includes(n.id) && !graph.sinks.includes(n.id))) {
        const net = edges.reduce((sum,e) => sum + (e.target === node.id ? final.flows[e.id] : 0) - (e.source === node.id ? final.flows[e.id] : 0),0)
        expect(net).toBe(0)
      }
    }
  })
})
