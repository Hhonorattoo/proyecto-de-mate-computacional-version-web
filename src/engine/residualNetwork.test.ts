import {describe,expect,it} from 'vitest'
import {residualNetwork} from './residualNetwork'
import {buildSimulation} from './fordFulkerson'
import {exampleGraph} from '../data/example'
import {reverseResidualExample} from '../data/reverseResidualExample'

describe('Red residual visible por instantánea',()=>{
  it('muestra capacidades c−f y f en cada fase y omite arcos sin capacidad',()=>{
    for(const graph of [exampleGraph, reverseResidualExample]) for(const step of buildSimulation(graph)) {
      const {rows,arcs}=residualNetwork(graph,step.flows)
      for(const row of rows) {
        expect(row.forward+row.inverse).toBe(row.capacity)
        expect(row.inverse).toBe(step.flows[row.id])
        for(const direction of [1,-1] as const) {
          const amount=direction===1 ? row.forward : row.inverse
          const found=arcs.find(a=>a.edgeId===row.id && a.direction===direction)
          if(amount===0) expect(found).toBeUndefined()
          else expect(found).toMatchObject({residualCapacity:amount,from:direction===1 ? row.source : row.target,to:direction===1 ? row.target : row.source})
        }
      }
    }
  })
  it('incluye todas las inversas disponibles, aunque no se hayan usado en un camino',()=>{
    const step=buildSimulation(exampleGraph).find(s=>s.phase==='FLUJO_ACTUALIZADO')!
    expect(step.reverseHistory).toHaveLength(0)
    const inverses=residualNetwork(exampleGraph,step.flows).arcs.filter(a=>a.direction===-1)
    expect(inverses.length).toBeGreaterThan(0)
    expect(inverses.every(a=>a.residualCapacity>0)).toBe(true)
  })
  it('refleja la cancelación F→B sin confundirla con un rastro histórico',()=>{
    const steps=buildSimulation(reverseResidualExample)
    const before=steps.find(s=>s.phase==='CAMINO_ENCONTRADO' && s.path?.arcs.some(a=>a.direction===-1))!
    const after=steps.find(s=>s.phase==='FLUJO_ACTUALIZADO' && s.iteration===before.iteration)!
    const arc=before.path!.arcs.find(a=>a.direction===-1)!
    const rowBefore=residualNetwork(reverseResidualExample,before.flows).rows.find(r=>r.id===arc.edgeId)!
    const rowAfter=residualNetwork(reverseResidualExample,after.flows).rows.find(r=>r.id===arc.edgeId)!
    expect(rowBefore.inverse-rowAfter.inverse).toBe(before.path!.bottleneck)
    expect(rowAfter.forward-rowBefore.forward).toBe(before.path!.bottleneck)
  })
  it('reconstruye los flujos ficticios por balance y mantiene su capacidad no limitante',()=>{
    const graph={...exampleGraph,sources:['A','B'],sinks:['F','G']}
    const final=buildSimulation(graph).at(-1)!
    const rows=residualNetwork(graph,final.flows).rows.filter(r=>r.virtual)
    expect(rows).toHaveLength(4)
    expect(rows.filter(r=>r.source==='__SUPER_SOURCE__').reduce((sum,r)=>sum+r.flow,0)).toBe(final.totalFlow)
    expect(rows.filter(r=>r.target==='__SUPER_SINK__').reduce((sum,r)=>sum+r.flow,0)).toBe(final.totalFlow)
    expect(rows.every(r=>r.forward>0 && r.inverse>=0)).toBe(true)
  })
})
