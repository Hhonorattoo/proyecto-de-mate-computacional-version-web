import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background, BaseEdge, Controls, EdgeLabelRenderer, MarkerType, MiniMap, ReactFlow,
  useNodesState, type Connection, type Edge, type EdgeProps, type Node,
} from '@xyflow/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowLeft, ArrowRight, CheckCircle2, 
  ChevronRight, CircleHelp, Download, 
  Pause, Play, Plus, ShieldCheck, SkipBack, SkipForward,
  Trash2, X,
} from 'lucide-react'
import { FlowMark } from './components/FlowMark'
import { FlowSchematic } from './components/FlowSchematic'
import { buildSimulation, validateGraph } from './engine/fordFulkerson'
import { residualNetwork } from './engine/residualNetwork'
import { createGraph, type CreationMode } from './engine/createGraph'
import type { GraphEdge, GraphInput, SimulationStep } from './engine/types'

const phases: Record<SimulationStep['phase'], { name: string; short: string; number: string }> = {
  BUSQUEDA_BFS: { name: 'Búsqueda BFS', short: 'Búsqueda', number: '01' },
  CAMINO_ENCONTRADO: { name: 'Camino encontrado', short: 'Camino', number: '02' },
  FLUJO_ACTUALIZADO: { name: 'Actualización de flujo', short: 'Actualización', number: '03' },
  FINAL: { name: 'Corte mínimo · final', short: 'Final', number: '04' },
}

function ReverseResidualEdge({
  id, sourceX, sourceY, targetX, targetY, markerEnd, style, label, labelStyle,
}: EdgeProps) {
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const length = Math.hypot(dx, dy) || 1
  const offset = 66
  const controlX = (sourceX + targetX) / 2 - (dy / length) * offset
  const controlY = (sourceY + targetY) / 2 + (dx / length) * offset
  const path = `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`
  const labelX = (sourceX + 2 * controlX + targetX) / 4
  const labelY = (sourceY + 2 * controlY + targetY) / 4
  return <>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} interactionWidth={26} />
    {label && <EdgeLabelRenderer>
      <div className="reverse-edge-label" style={{
        position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'none', ...labelStyle,
      }}>{label}</div>
    </EdgeLabelRenderer>}
  </>
}
const edgeTypes = { reverseResidual: ReverseResidualEdge }

function makeNodes(graph: GraphInput, step?: SimulationStep): Node[] {
  const centerX = 420, centerY = 270, radius = 210
  return graph.nodes.map((n, i) => {
    const angle = (2 * Math.PI * i / graph.nodes.length) - Math.PI / 2
    const source = graph.sources.includes(n.id)
    const sink = graph.sinks.includes(n.id)
    const partition = step?.finished ? step.reachable.includes(n.id) ? 'partition-s' : 'partition-t' : ''
    return {
      id: n.id,
      position: { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) },
      data: { label: <div className="node-inner"><span>{n.label}</span></div> },
      type: 'default',
      className: [source ? 'source-node' : '', sink ? 'sink-node' : '', partition].filter(Boolean).join(' '),
    }
  })
}

function makeEdges(edges: GraphEdge[], step?: SimulationStep, selectedEdge?: string): Edge[] {
  const original: Edge[] = edges.map(e => {
    const isPath = !!step?.path?.arcs.some(a => a.edgeId === e.id && a.direction === 1)
    const isCut = !!step?.cutEdges.includes(e.id)
    return {
      id: e.id, source: e.source, target: e.target,
      label: `${step?.flows[e.id] ?? 0}/${e.capacity}`,
      animated: isPath && step?.phase === 'FLUJO_ACTUALIZADO',
      className: [isCut ? 'cut-edge' : '', isPath ? 'path-edge' : '', selectedEdge === e.id ? 'selected-flow-edge' : ''].filter(Boolean).join(' '),
      markerEnd: { type: MarkerType.ArrowClosed, color: isCut ? '#fc7685' : isPath ? '#80ddff' : '#638099' },
      style: { strokeWidth: isCut || isPath ? 3 : 2 },
    }
  })

  // El estado final conserva los regresos utilizados; no se confunde con una
  // afirmación de que la arista tenga todavía capacidad residual positiva.
  const reverseTraces = step?.finished
    ? step.reverseHistory
    : (step?.path?.arcs ?? []).filter(arc => arc.direction === -1).map(arc => ({
        arc, bottleneck: step?.path?.bottleneck ?? 0, iteration: step?.iteration ?? 0,
      }))
  const uniqueTraces = new Map<string, (typeof reverseTraces)[number]>()
  for (const trace of reverseTraces) uniqueTraces.set(`${trace.arc.edgeId}:${trace.arc.from}->${trace.arc.to}`, trace)
  const reverseResiduals: Edge[] = [...uniqueTraces.values()].map(trace => ({
    id: `reverse-history-${trace.arc.edgeId}-${trace.arc.from}-${trace.arc.to}`,
    source: trace.arc.from, target: trace.arc.to, type: 'reverseResidual',
    label: step?.finished ? `↶ histórico · ${trace.iteration}` : `↶ −${trace.bottleneck}`,
    labelStyle: { fill: '#f0abfc', fontWeight: 800, fontSize: 11 },
    animated: !step?.finished,
    className: 'reverse-path',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ed83fc' },
    zIndex: 25, interactionWidth: 24,
    style: { stroke: '#e879f9', strokeWidth: 4, strokeDasharray: '8 5' },
  }))
  return [...original, ...reverseResiduals]
}

function downloadText(filename: string, text: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function Welcome({ enter }: { enter: () => void }) {
  const reducedMotion = useReducedMotion()
  return <div className="welcome-screen">
    <header className="welcome-nav">
      <a className="welcome-logo" href="#/inicio"><span className="welcome-logo-icon"><FlowMark size={23}/></span><span className="welcome-logo-word">Flow <span>Fulkerson</span></span><small className="welcome-brand-edition">/ 26</small></a>
      <div className="welcome-nav-end"><span className="welcome-course">LABORATORIO DE ALGORITMOS · 2026</span><button className="welcome-nav-enter" onClick={enter}>ABRIR SIMULADOR <ArrowRight size={16}/></button></div>
    </header>
    <main className="welcome-main">
      <section className="welcome-copy">
        <motion.div className="welcome-kicker" initial={reducedMotion ? false : {opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.5}}><span className="welcome-live-dot"/> REDES DIRIGIDAS / FLUJO MÁXIMO <span className="kicker-line"/></motion.div>
        <motion.h1 initial={reducedMotion ? false : {opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.7,delay:.08}}>Flow<span>Fulkerson</span></motion.h1>
        <motion.p className="welcome-statement" initial={reducedMotion ? false : {opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.2}}>Hay un límite en cada red. <em>Encuéntralo.</em></motion.p>
        <motion.p className="welcome-subtitle" initial={reducedMotion ? false : {opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.29}}>Construye grafos, observa cómo cambia el flujo y comprende cada decisión del algoritmo de Ford–Fulkerson. Desde el primer camino hasta el corte mínimo.</motion.p>
        <motion.div className="welcome-actions" initial={reducedMotion ? false : {opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{duration:.55,delay:.38}}>
          <motion.button className="welcome-cta" onClick={enter} whileHover={reducedMotion ? undefined : {x:3}} whileTap={{scale:.985}}>Entrar al laboratorio <ArrowRight size={21}/></motion.button>
          <span className="welcome-caption"><span className="caption-stripe"/> INTERACTIVO / VISUAL / PASO A PASO</span>
        </motion.div>
      </section>
      <motion.section className="welcome-visual" initial={reducedMotion ? false : {opacity:0,x:24}} animate={{opacity:1,x:0}} transition={{duration:.85,delay:.25}}><FlowSchematic /></motion.section>
    </main>
    <div className="welcome-bottom">
      <div><span className="welcome-bottom-index">01 — DISEÑA</span><strong>Modela la red</strong><small>Hasta 16 vértices. Fuentes y sumideros múltiples.</small></div>
      <div><span className="welcome-bottom-index">02 — RECORRE</span><strong>Observa el algoritmo</strong><small>BFS, capacidades residuales y caminos inversos.</small></div>
      <div><span className="welcome-bottom-index">03 — DEMUESTRA</span><strong>Explora el resultado</strong><small>Historial completo, flujo máximo y corte mínimo.</small></div>
    </div>
    <div className="welcome-scroll"><span>PROYECTO DE MATEMÁTICA COMPUTACIONAL</span><span>EDICIÓN 2026</span></div>
  </div>
}

function TerminalChips({
  graph, kind, change,
}: { graph: GraphInput; kind: 'sources' | 'sinks'; change: (next: GraphInput) => void }) {
  const active = graph[kind]
  const opposite = kind === 'sources' ? 'sinks' : 'sources'
  return <div className="terminal-chips" role="group" aria-label={kind === 'sources' ? 'Nodos fuente' : 'Nodos sumidero'}>
    {graph.nodes.map(n => <button key={n.id} type="button" aria-pressed={active.includes(n.id)}
      className={`terminal-chip ${active.includes(n.id) ? kind === 'sources' ? 'terminal-source active' : 'terminal-sink active' : ''}`}
      onClick={() => change({
        ...graph, [kind]: active.includes(n.id) ? active.filter(id => id !== n.id) : [...active, n.id],
        [opposite]: graph[opposite].filter(id => id !== n.id),
      })}>{n.label}</button>)}
  </div>
}


type Screen = 'inicio' | 'configuracion' | 'red' | 'simulacion' | 'resultado'

function GraphCanvas({graph, step, editable = false, movableVirtual = false, positions, onPositionChange, onConnect, onSelect}: {
  graph: GraphInput; step?: SimulationStep; editable?: boolean; movableVirtual?: boolean; positions: Record<string,{x:number;y:number}>; onPositionChange:(id:string,position:{x:number;y:number})=>void;
  onConnect?: (connection: Connection) => void; onSelect?: (id: string) => void;
}) {
  const [showResidual,setShowResidual] = useState(false)
  const residual = residualNetwork(graph,step?.flows ?? {})
  const virtualNodes: Node[] = []
  const virtualEdges: Edge[] = []
  const capacity = graph.edges.reduce((sum,e) => sum + e.capacity,0) + 1
  for (const kind of ['sources','sinks'] as const) {
    if (graph[kind].length < 2) continue
    const source = kind === 'sources'
    const id = source ? '__SUPER_SOURCE__' : '__SUPER_SINK__'
    virtualNodes.push({id,position:{x:source ? 30 : 810,y:270},data:{label:<div className="node-inner"><span>{source ? 'S*' : 'T*'}</span><small>{source ? 'Superfuente' : 'Supersumidero'}</small></div>},className:`virtual-node ${source ? 'source-node' : 'sink-node'}`,connectable:false,draggable:movableVirtual,deletable:false})
    for (const terminal of graph[kind]) {
      const balance = graph.edges.reduce((sum,e) => sum + (e.source === terminal ? step?.flows[e.id] ?? 0 : 0) - (e.target === terminal ? step?.flows[e.id] ?? 0 : 0),0)
      virtualEdges.push({id:`virtual-${terminal}-${kind}`,source:source ? id : terminal,target:source ? terminal : id,label:`${source ? balance : -balance}/${capacity}`,style:{stroke:source ? '#65d9b8' : '#f7ba79',strokeDasharray:'5 5'},markerEnd:{type:MarkerType.ArrowClosed,color:source ? '#65d9b8' : '#f7ba79'},selectable:false})
    }
  }
  const [nodes, setNodes, onNodesChange] = useNodesState([...makeNodes(graph, step),...virtualNodes].map(n=>({...n,position:positions[n.id] ?? n.position})))
  useEffect(() => {
    const fresh = [...makeNodes(graph, step),...virtualNodes]
    setNodes(previous => fresh.map(n => ({...n, measured:previous.find(p=>p.id===n.id)?.measured, position:positions[n.id] ?? previous.find(p=>p.id===n.id)?.position ?? n.position})))
  }, [graph, step, setNodes, positions])
  const displayEdges: Edge[] = showResidual && step ? residual.arcs.map(arc=>{
    const inverse=arc.direction===-1
    const active=step.phase==='CAMINO_ENCONTRADO' && step.path?.arcs.some(a=>a.edgeId===arc.edgeId && a.direction===arc.direction)
    const color=inverse ? '#df9bfa' : active ? '#80ddff' : '#7199bc'
    return {id:`residual-${arc.edgeId}-${arc.direction}`,source:arc.from,target:arc.to,type:inverse ? 'reverseResidual' : 'default',label:`${inverse ? '↶ ' : ''}r ${arc.residualCapacity}`,markerEnd:{type:MarkerType.ArrowClosed,color},style:{stroke:color,strokeWidth:active ? 3 : 2,strokeDasharray:inverse || arc.virtual ? '6 4' : undefined},className:inverse ? 'reverse-path' : '',labelStyle:{fill:color,fontSize:12},selectable:false}
  }) : [...makeEdges(graph.edges,step),...virtualEdges]
  const name=(id:string)=>id==='__SUPER_SOURCE__' ? 'S*' : id==='__SUPER_SINK__' ? 'T*' : id
  return <div className="graph-stage">
    {step && <div className="graph-view-switch" role="group" aria-label="Vista del grafo"><button aria-pressed={!showResidual} onClick={()=>setShowResidual(false)}>Flujo / capacidad</button><button aria-pressed={showResidual} onClick={()=>setShowResidual(true)}>Red residual</button><span>{showResidual ? 'r = capacidad disponible · morado = arco inverso' : 'f / c = flujo asignado / capacidad original'}</span></div>}
    <div className="graph-canvas staged-canvas">
    <ReactFlow key={`${graph.nodes.length}-${virtualNodes.map(n=>n.id).join('-')}`} nodes={nodes} edges={displayEdges} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onNodeDragStop={(_,node)=>onPositionChange(node.id,node.position)} onConnect={onConnect} onEdgeClick={(_,edge)=>onSelect?.(edge.id)} fitView fitViewOptions={{padding:.18}} nodesDraggable nodesConnectable={editable} deleteKeyCode={null} minZoom={.15} maxZoom={2}>
      <Background color="#25364b" gap={22} size={1}/><Controls showInteractive={false}/><MiniMap nodeColor={n=>graph.sources.includes(n.id) || n.id==='__SUPER_SOURCE__' ? '#65d9b8' : graph.sinks.includes(n.id) || n.id==='__SUPER_SINK__' ? '#f7ba79' : '#647d99'} maskColor="rgba(4,12,22,.74)"/>
    </ReactFlow>
    <div className="canvas-overlay-top"><span><i className="legend-dot dot-source"/> Fuente</span><span><i className="legend-dot dot-sink"/> Sumidero</span>{step && <span><i className="legend-dot dot-path"/> Camino</span>}{step?.reverseHistory.length ? <span><i className="legend-dot dot-reverse"/> Regreso</span> : null}</div>
    <div className="canvas-overlay-bottom">{editable ? 'Une conectores para crear aristas · Arrastra para ordenar' : showResidual ? 'Solo se dibujan arcos con capacidad residual positiva' : 'Arrastra para ordenar · Etiquetas: flujo / capacidad'}</div>
  </div>
    {step && <details className="residual-details"><summary>Capacidades residuales <span>directa c − f · inversa f</span></summary><p>La directa permite añadir flujo. La inversa permite cancelar flujo ya asignado. Los ceros no se dibujan en la vista residual.</p><div className="residual-scroll"><table className="result-table"><thead><tr><th>Arista original</th><th>Flujo f</th><th>Capacidad c</th><th>Directa c − f</th><th>Inversa f</th></tr></thead><tbody>{residual.rows.map(row=><tr key={row.id}><td>{name(row.source)} → {name(row.target)}{row.virtual ? ' · ficticia' : ''}</td><td>{row.flow}</td><td>{row.capacity}</td><td>{row.forward}</td><td>{row.inverse}</td></tr>)}</tbody></table></div></details>}
  </div>
}

export default function App() {
  const [screen,setScreen] = useState<Screen>(window.location.hash && window.location.hash !== '#/inicio' ? 'configuracion' : 'inicio')
  const [mode,setMode] = useState<CreationMode>('manual')
  const [graphMode,setGraphMode] = useState<CreationMode>('manual')
  const [count,setCount] = useState('7')
  const [positions,setPositions] = useState<Record<string,{x:number;y:number}>>({})
  const onPositionChange=(id:string,position:{x:number;y:number})=>setPositions(prev=>({...prev,[id]:position}))
  const [graph,setGraph] = useState<GraphInput>(()=>createGraph(7,'manual'))
  const [configured,setConfigured] = useState(false)
  const [steps,setSteps] = useState<SimulationStep[]>([])
  const [stepIndex,setStepIndex] = useState(0)
  const [playing,setPlaying] = useState(false)
  const [error,setError] = useState('')
  const [sourceDraft,setSourceDraft] = useState('A')
  const [targetDraft,setTargetDraft] = useState('B')
  const [capacityDraft,setCapacityDraft] = useState('5')
  const [showMatrix,setShowMatrix] = useState(false)
  const reducedMotion = useReducedMotion()
  const manual = (screen==='configuracion' ? mode : graphMode) === 'manual'
  const current = screen === 'resultado' ? steps.at(-1) : steps[stepIndex]
  const final = steps.at(-1)
  const validation = useMemo(()=>validateGraph(graph),[graph])
  const history = steps.map((step,index)=>({step,index})).filter(({step,index})=>step.phase==='FLUJO_ACTUALIZADO' && (screen==='resultado' || index<=stepIndex))
  const goTo = useCallback((next:Screen)=>{
    setPlaying(false); setScreen(next); setError(''); setShowMatrix(false)
    window.location.hash=`/${next}`
    window.scrollTo({top:0,behavior:'instant'})
  },[])
  useEffect(()=>{
    const update=()=>{
      const route=window.location.hash.slice(2)
      let next:Screen = ['inicio','configuracion','red','simulacion','resultado'].includes(route) ? route as Screen : 'inicio'
      if (next==='red' && !configured) next='configuracion'
      if ((next==='simulacion' || next==='resultado') && !steps.length) next=configured ? 'red' : 'configuracion'
      setPlaying(false);setScreen(next);setShowMatrix(false);setError('')
    }
    window.addEventListener('hashchange',update)
    return ()=>window.removeEventListener('hashchange',update)
  },[configured,steps.length])
  useEffect(()=>{
    if(!playing || screen!=='simulacion' || current?.finished) { if(playing) setPlaying(false); return }
    const timer=window.setTimeout(()=>setStepIndex(i=>Math.min(i+1,steps.length-1)),1300)
    return ()=>window.clearTimeout(timer)
  },[playing,screen,current,steps.length])
  function updateGraph(next:GraphInput){setGraph(next);setSteps([]);setStepIndex(0);setError('')}
  function configure(){try{setPositions({});updateGraph(createGraph(Number(count),mode));setConfigured(true);setGraphMode(mode);setSourceDraft('A');setTargetDraft('B');goTo('red')}catch{setError('Elige un entero entre 7 y 16.')}}
  function addEdge(source=sourceDraft,target=targetDraft){
    const capacity=Number(capacityDraft)
    if(source===target || !Number.isSafeInteger(capacity) || capacity<=0){setError('Elige nodos distintos y una capacidad entera positiva.');return}
    if(graph.edges.some(e=>e.source===source && e.target===target)){setError('Esa conexión ya existe.');return}
    updateGraph({...graph,edges:[...graph.edges,{id:crypto.randomUUID(),source,target,capacity}]})
  }
  function start(){
    if(validation.length){setError(validation.join(' '));return}
    try{setSteps(buildSimulation(graph));setStepIndex(0);goTo('simulacion')}catch(e){setError(e instanceof Error ? e.message : 'No se pudo iniciar.')}
  }
  const goStep=(index:number)=>{setPlaying(false);setStepIndex(Math.max(0,Math.min(steps.length-1,index)))}
  function exportCSV(){
    const rows=[['Iteración','Etapa','Flujo','Cuello de botella','Camino'],...steps.map(s=>[String(s.iteration),s.phase,String(s.totalFlow),String(s.path?.bottleneck ?? ''),s.path?.nodes.join(' → ') ?? ''])]
    downloadText('Flow-Fulkerson-historial.csv','\ufeff'+rows.map(r=>r.map(c=>`"${c.replaceAll('"','""')}"`).join(',')).join('\r\n'),'text/csv')
  }
  const historyPanel=<aside className="stage-history"><div className="history-head"><h2>Historial</h2><button onClick={exportCSV} className="csv-download" aria-label="Descargar dataset de la simulación en CSV" title="Descargar dataset de etapas, caminos y flujos en CSV"><Download size={16}/><span>Descargar CSV</span></button></div><p className="stage-hint">{history.length} {history.length===1 ? 'camino aumentante' : 'caminos aumentantes'}</p><div className="history-list">{history.length ? history.map(({step,index})=><button className={`history-entry ${current?.iteration===step.iteration ? 'history-selected' : ''}`} key={index} onClick={()=>{goStep(index);if(screen==='resultado')goTo('simulacion')}}><span className="history-index">{String(step.iteration).padStart(2,'0')}</span><span className="history-description"><strong>{step.path?.nodes.join(' → ')}</strong><small>+{step.path?.bottleneck} · Total {step.totalFlow}{step.path?.arcs.some(a=>a.direction===-1) ? ' · ↶ inversa' : ''}</small></span><ChevronRight size={16}/></button>):<p className="stage-hint">Los caminos se registran al actualizar el flujo.</p>}</div></aside>
  const matrix=<details className="matrix-section" open={showMatrix} onToggle={e=>setShowMatrix(e.currentTarget.open)}><summary>Matriz de capacidades <span>{graph.nodes.length} × {graph.nodes.length}</span></summary><div className="matrix-scroll"><table className="capacity-table"><caption>Fila: origen · columna: destino · —: sin conexión.</caption><thead><tr><th scope="col">De / a</th>{graph.nodes.map(n=><th scope="col" key={n.id}>{n.id}</th>)}</tr></thead><tbody>{graph.nodes.map(n=><tr key={n.id}><th scope="row">{n.id}</th>{graph.nodes.map(to=>{const edge=graph.edges.find(e=>e.source===n.id && e.target===to.id);return <td key={to.id} className={edge ? 'matrix-active' : ''}>{edge?.capacity ?? '—'}</td>})}</tr>)}</tbody></table></div></details>
  const back:Screen=screen==='resultado' ? 'simulacion' : screen==='simulacion' ? 'red' : screen==='red' ? 'configuracion' : 'inicio'
  return <AnimatePresence mode="wait">
    {screen==='inicio' ? <motion.div key="welcome" initial={false} animate={{opacity:1}} exit={{opacity:0}}><Welcome enter={()=>goTo('configuracion')}/></motion.div> :
    <motion.div key={screen} className={`lab-app stage-app stage-${screen}`} initial={reducedMotion ? false : {opacity:.7,y:8}} animate={{opacity:1,y:0}} transition={{duration:.2}}>
      <header className="lab-header"><button className="lab-brand" onClick={()=>goTo('inicio')} aria-label="Volver a portada"><FlowMark size={28}/><span>Flow <b>Fulkerson</b><small>LABORATORIO DE FLUJO</small></span></button><nav aria-label="Etapas del laboratorio" className="stage-nav">{(['configuracion','red','simulacion','resultado'] as Screen[]).map((item,i)=><span key={item} aria-current={screen===item ? 'step' : undefined}>{i+1}. {['Configurar','Construir','Simular','Resultado'][i]}</span>)}</nav><span className="stage-version">v1.0</span></header>
      <main className="stage-container">
        <button className="stage-back" onClick={()=>goTo(back)}><ArrowLeft size={16}/>{screen==='red' ? 'Volver a configurar' : screen==='simulacion' ? 'Volver a la red' : screen==='resultado' ? 'Volver a la simulación' : 'Volver al inicio'}</button>
        {screen==='configuracion' ? <form className="setup-panel" onSubmit={e=>{e.preventDefault();configure()}}><h1>Prepara tu red.</h1><p className="stage-hint">Define su tamaño y cómo vas a construirla.</p><label className="setup-count">Cantidad de nodos<span>Entre 7 y 16 vértices</span><input aria-label="Cantidad de nodos" type="number" min="7" max="16" step="1" required value={count} onChange={e=>setCount(e.target.value)}/></label><fieldset className="setup-modes"><legend>Modo de construcción</legend><label className={manual ? 'chosen' : ''}><input type="radio" name="mode" checked={manual} onChange={()=>setMode('manual')}/><strong>Manual</strong><span>Une los nodos y asigna las capacidades.</span></label><label className={!manual ? 'chosen' : ''}><input type="radio" name="mode" checked={!manual} onChange={()=>setMode('aleatoria')}/><strong>Automática</strong><span>Explora una red generada al azar.</span></label></fieldset><button className="studio-button studio-button-teal full" type="submit">Configurar la red <ArrowRight size={18}/></button></form> : null}
        {screen==='red' && <><div className="stage-title"><div><h1>Arquitectura de la red.</h1><p>{graph.nodes.length} nodos · {graph.edges.length} conexiones · {manual ? 'Construcción manual' : 'Red automática'}</p></div><div className="construction-actions">        <div className={`validation-message ${validation.length ? 'invalid' : 'valid'}`} role="status">{validation.length ? <CircleHelp size={18}/> : <ShieldCheck size={18}/>}<span>{validation[0] ?? 'Red válida y lista para ejecutar.'}</span></div><button className="studio-button studio-button-teal full" onClick={start} disabled={validation.length>0}><Play size={18}/>Iniciar simulación</button></div></div><div className="construction-layout"><aside className="stage-tools"><h2>Fuentes y sumideros</h2><div className="form-group"><label>Vértices fuente</label><TerminalChips graph={graph} kind="sources" change={updateGraph}/></div><div className="form-group"><label>Vértices sumidero</label><TerminalChips graph={graph} kind="sinks" change={updateGraph}/></div><div className="virtual-explainer"><h3>Nodos ficticios</h3>{graph.sources.length>1 ? <p><b className="source-text">S* · Superfuente</b> conecta {graph.sources.join(', ')}.</p>:<p>Selecciona varias fuentes para incorporar S*.</p>}{graph.sinks.length>1 ? <p><b className="sink-text">T* · Supersumidero</b> recibe de {graph.sinks.join(', ')}.</p>:<p>Selecciona varios sumideros para incorporar T*.</p>}{(graph.sources.length>1 || graph.sinks.length>1) && <small>Arcos discontinuos: capacidad {graph.edges.reduce((sum,e)=>sum+e.capacity,0)+1}, superior a la suma original; no limita el flujo. No cuentan entre los {graph.nodes.length} nodos elegidos.</small>}</div>
        {manual ? <form className="connection-form" onSubmit={e=>{e.preventDefault();addEdge()}}><h2>Editor de conexiones</h2><div className="link-selectors"><select aria-label="Nodo inicial" value={sourceDraft} onChange={e=>setSourceDraft(e.target.value)}>{graph.nodes.map(n=><option key={n.id}>{n.id}</option>)}</select><ArrowRight size={16}/><select aria-label="Nodo final" value={targetDraft} onChange={e=>setTargetDraft(e.target.value)}>{graph.nodes.map(n=><option key={n.id}>{n.id}</option>)}</select></div><label>Capacidad<input type="number" aria-label="Capacidad de nueva arista" min="1" step="1" required value={capacityDraft} onChange={e=>setCapacityDraft(e.target.value)}/></label><button className="studio-button studio-button-dark full"><Plus size={16}/>Añadir conexión</button></form>:<div className="virtual-explainer"><h2>Explorar red automática</h2><p>La red está generada. Elige sus terminales y comprueba su estado antes de ejecutar.</p></div>}
</aside>
        <section className="construction-graph" aria-label="Red editable"><GraphCanvas key={`${graph.nodes.length}-${graph.sources.join()}-${graph.sinks.join()}`} positions={positions} onPositionChange={onPositionChange} graph={graph} movableVirtual editable={manual} onConnect={c=>{if(c.source && c.target && !c.source.startsWith('__') && !c.target.startsWith('__')) addEdge(c.source,c.target)}}/>
        {manual && <details className="edge-editor"><summary>Conexiones y capacidades <span>{graph.edges.length} aristas</span></summary><div className="edge-editor-list">{graph.edges.length ? graph.edges.map(e=><div className="edge-editor-row" key={e.id}><span>{e.source} → {e.target}</span><input aria-label={`Capacidad de ${e.source} a ${e.target}`} type="number" min="1" step="1" defaultValue={e.capacity} key={`${e.id}-${e.capacity}`} onBlur={event=>{const capacity=Number(event.target.value);if(!Number.isSafeInteger(capacity)||capacity<=0){event.target.value=String(e.capacity);setError('La capacidad debe ser un entero positivo.');return}if(capacity!==e.capacity)updateGraph({...graph,edges:graph.edges.map(a=>a.id===e.id ? {...a,capacity}:a)})}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/><button aria-label={`Eliminar conexión ${e.source} a ${e.target}`} onClick={()=>updateGraph({...graph,edges:graph.edges.filter(a=>a.id!==e.id)})}><Trash2 size={17}/></button></div>):<p className="stage-hint">Añade conexiones desde el editor o uniendo los conectores.</p>}</div></details>}{matrix}</section></div></>}
        {screen==='simulacion' && current && <><div className="stage-title"><div><h1>Sigue el flujo.</h1><p>{current.finished ? 'No quedan caminos aumentantes. Ya puedes consultar el resultado.' : `Iteración ${current.iteration} · ${phases[current.phase].name}`}</p></div></div><div className="simulation-layout">{historyPanel}<section className="simulation-graph" aria-label="Grafo de simulación"><GraphCanvas key={`${graph.nodes.length}-${graph.sources.join()}-${graph.sinks.join()}`} positions={positions} onPositionChange={onPositionChange} graph={graph} step={current}/></section><aside className="stage-simulation"><h2>Simulación</h2><div className="flow-feature"><span>FLUJO ACUMULADO</span><div className="feature-flow"><strong>{current.totalFlow}</strong><small>unidades</small></div></div><div className="detail-stats"><div><span>ITERACIÓN</span><strong>{current.iteration}</strong></div><div><span>CUELLO DE BOTELLA</span><strong>{current.path?.bottleneck ?? '—'}</strong></div></div><div className="phase-card"><h3>{phases[current.phase].name}</h3>{current.path && <p className="stage-path">{current.path.nodes.join(' → ')}</p>}{current.path?.arcs.some(a=>a.direction===-1) && <small className="reverse-text">Incluye cancelación de flujo inverso.</small>}</div><div className="playback-heading"><span>Estado {stepIndex+1} / {steps.length}</span></div><div className="playback-buttons"><button aria-label="Primer paso" disabled={!stepIndex} onClick={()=>goStep(0)}><SkipBack size={18}/></button><button aria-label="Paso anterior" disabled={!stepIndex} onClick={()=>goStep(stepIndex-1)}><ArrowLeft size={18}/></button><button aria-label={playing ? 'Pausar' : 'Reproducir automáticamente'} disabled={current.finished} onClick={()=>setPlaying(v=>!v)}>{playing ? <Pause size={18}/> : <Play size={18}/>}</button><button aria-label="Último paso" disabled={current.finished} onClick={()=>goStep(steps.length-1)}><SkipForward size={18}/></button></div><button className="studio-button studio-button-teal full stage-next" onClick={()=>current.finished ? goTo('resultado') : goStep(stepIndex+1)}><Play size={18} fill="currentColor"/>{current.finished ? 'Ver resultado final' : 'Siguiente etapa'}</button></aside></div></>}
        {screen==='resultado' && final && <><div className="stage-title"><div><h1>Resultado comprobado.</h1><p>El flujo encontrado alcanza la capacidad del corte mínimo.</p></div><CheckCircle2 className="result-seal" size={40}/></div><div className="result-overview"><div><span>FLUJO MÁXIMO</span><strong>{final.totalFlow}</strong></div><span className="result-equals">=</span><div><span>CAPACIDAD DEL CORTE</span><strong>{final.cutCapacity}</strong></div><p>{final.iteration} {final.iteration===1 ? 'camino aumentante' : 'caminos aumentantes'} · {graph.nodes.length} nodos · {graph.edges.length} aristas</p></div><div className="result-layout"><section><h2>El corte que certifica el máximo</h2><GraphCanvas key={`${graph.nodes.length}-${graph.sources.join()}-${graph.sinks.join()}`} positions={positions} onPositionChange={onPositionChange} graph={graph} step={final}/><div className="result-partitions"><div><h3>Conjunto S</h3><p>{final.reachable.join(', ')}</p></div><div><h3>Conjunto T</h3><p>{graph.nodes.filter(n=>!final.reachable.includes(n.id)).map(n=>n.id).join(', ')}</p></div></div></section><section className="cut-details"><h2>Aristas del corte mínimo</h2><table className="result-table"><thead><tr><th>Arista</th><th>Capacidad</th></tr></thead><tbody>{graph.edges.filter(e=>final.cutEdges.includes(e.id)).map(e=><tr key={e.id}><td>{e.source} → {e.target}</td><td>{e.capacity}</td></tr>)}</tbody><tfoot><tr><th>Total</th><td>{final.cutCapacity}</td></tr></tfoot></table><p className="stage-hint">Las aristas rojas separan S de T. Su capacidad total coincide con el flujo máximo.</p><h2>Asignación final de flujo</h2><div className="result-table-scroll"><table className="result-table"><thead><tr><th>Arista</th><th>Flujo</th><th>Capacidad</th></tr></thead><tbody>{graph.edges.map(e=><tr key={e.id}><td>{e.source} → {e.target}</td><td>{final.flows[e.id]}</td><td>{e.capacity}</td></tr>)}</tbody></table></div></section></div><section className="result-paths"><h2>Caminos aumentantes</h2>{historyPanel}</section></>}
        {error && <div className="alert-error stage-error" role="alert">{error}<button aria-label="Cerrar error" onClick={()=>setError('')}><X size={17}/></button></div>}
      </main>
    </motion.div>}
  </AnimatePresence>
}
