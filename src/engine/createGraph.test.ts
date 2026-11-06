import {describe,expect,it} from 'vitest'
import {createGraph} from './createGraph'
import {validateGraph,buildSimulation} from './fordFulkerson'
describe('Configuración de red',()=>{
  it('conserva n exacto en ambos modos para todo el rango',()=>{
    for(let n=7;n<=16;n++){
      const manual=createGraph(n,'manual')
      expect(manual.nodes).toHaveLength(n)
      expect(manual.edges).toHaveLength(0)
      const auto=createGraph(n,'aleatoria')
      expect(auto.nodes).toHaveLength(n)
      expect(validateGraph(auto)).toEqual([])
      const final=buildSimulation(auto).at(-1)!
      expect(final.totalFlow).toBe(final.cutCapacity)
    }
  })
  it('rechaza cantidades fuera de rango o no enteras',()=>{
    for(const n of [0,6,17,7.5,NaN,Infinity]) expect(()=>createGraph(n,'manual')).toThrow()
  })
})
