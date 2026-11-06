import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background, BaseEdge, Controls, EdgeLabelRenderer, MarkerType, MiniMap, ReactFlow,
  useNodesState, type Connection, type Edge, type EdgeProps, type Node,
} from '@xyflow/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleHelp, Clock3, Download, GitBranch, Layers3, Menu,
  Network, Pause, Play, Plus, ShieldCheck, SkipBack, SkipForward,
  Trash2, X, Zap,
} from 'lucide-react'
import { FlowMark } from './components/FlowMark'
import { FlowSchematic } from './components/FlowSchematic'
import { buildSimulation, validateGraph } from './engine/fordFulkerson'
import { createGraph, type CreationMode } from './engine/createGraph'
import type { BfsLabel, GraphEdge, GraphInput, SimulationStep } from './engine/types'

const phases: Record<SimulationStep['phase'], { name: string; short: string; number: string }> = {
  BUSQUEDA_BFS: { name: 'Etiquetado BFS', short: 'Búsqueda', number: '01' },
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
    const bfs = step?.bfsLabels.find(label => label.node === n.id)
    const source = graph.sources.includes(n.id)
    const sink = graph.sinks.includes(n.id)
    const partition = step?.finished ? step.reachable.includes(n.id) ? 'partition-s' : 'partition-t' : ''
    return {
      id: n.id,
      position: { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) },
      data: { label: <div className="node-inner"><span>{n.label}</span>{bfs && !step?.finished &&
        <small title={`Predecesor: ${bfs.predecessor ?? 'Superfuente'}; capacidad ${bfs.available}`}>
          {bfs.sign === 'S' ? 'S*' : `${bfs.sign}${bfs.predecessor}`}:{bfs.available}
        </small>}</div> },
      type: 'default',
      className: [source ? 'source-node' : '', sink ? 'sink-node' : '', bfs && !step?.finished ? 'bfs-node' : '', partition].filter(Boolean).join(' '),
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
      markerEnd: { type: MarkerType.ArrowClosed, color: isCut ? '#fc7685' : isPath ? '#daf77f' : '#638099' },
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
      <a className="welcome-logo" href="#/inicio"><span className="welcome-logo-icon"><FlowMark size={23}/></span><span className="welcome-logo-word">FLOW<span>LAB</span></span><small className="welcome-brand-edition">/ 26</small></a>
      <div className="welcome-nav-end"><span className="welcome-course">LABORATORIO DE ALGORITMOS · 2026</span><button className="welcome-nav-enter" onClick={enter}>ABRIR SIMULADOR <ArrowRight size={16}/></button></div>
    </header>
    <main className="welcome-main">
      <section className="welcome-copy">
        <motion.div className="welcome-kicker" initial={reducedMotion ? false : {opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.5}}><span className="welcome-live-dot"/> REDES DIRIGIDAS / FLUJO MÁXIMO <span className="kicker-line"/></motion.div>
        <motion.h1 initial={reducedMotion ? false : {opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.7,delay:.08}}>FLOW<span>LAB</span><span className="welcome-title-period">.</span></motion.h1>
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

export default function App() {
  const [screen, setScreen] = useState<'inicio' | 'configuracion' | 'laboratorio'>(window.location.hash === '#/inicio' || !window.location.hash ? 'inicio' : 'configuracion')
  const [mode, setMode] = useState<CreationMode>('manual')
  const [count, setCount] = useState('7')
  const manual = mode === 'manual'
  const [graph, setGraph] = useState<GraphInput>(createGraph(7, 'manual'))
  const [steps, setSteps] = useState<SimulationStep[]>([])
  const [stepIndex, setStepIndex] = useState(-1)
  const [sourceDraft, setSourceDraft] = useState('A')
  const [targetDraft, setTargetDraft] = useState('B')
  const [capacityDraft, setCapacityDraft] = useState('5')
  const [selectedEdge, setSelectedEdge] = useState<string | undefined>()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [playing, setPlaying] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showAllEdges, setShowAllEdges] = useState(false)
  const [showMatrix, setShowMatrix] = useState(false)
  const [mobileToolsOpen, setMobileToolsOpen] = useState(true)
  const reducedMotion = useReducedMotion()
  const current = steps[stepIndex]
  const validation = useMemo(() => validateGraph(graph), [graph])
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes(graph, current))
  const edges = useMemo(() => makeEdges(graph.edges, current, selectedEdge), [graph.edges, current, selectedEdge])
  const historyIndices = useMemo(() => steps.map((step, index) => ({ step, index })).filter(({ step }) => step.phase === 'FLUJO_ACTUALIZADO'), [steps])
  const maxFlow = steps.at(-1)?.totalFlow ?? 0

  useEffect(() => {
    const update = () => setScreen(window.location.hash === '#/laboratorio' ? 'laboratorio' : window.location.hash === '#/configuracion' ? 'configuracion' : 'inicio')
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  useEffect(() => {
    const fresh = makeNodes(graph, current)
    setNodes(previous => {
      const positionMap = new Map(previous.map(n => [n.id, n.position]))
      return fresh.map(n => ({ ...n, position: positionMap.get(n.id) ?? n.position }))
    })
  }, [graph.nodes, graph.sources, graph.sinks, current, setNodes])
  useEffect(() => {
    if (!playing || !steps.length) return
    if (stepIndex >= steps.length - 1) { setPlaying(false); return }
    const timeout = window.setTimeout(() => setStepIndex(i => Math.min(i + 1, steps.length - 1)), reducedMotion ? 1150 : 1300)
    return () => window.clearTimeout(timeout)
  }, [playing, stepIndex, steps, reducedMotion])

  const goTo = (next: 'inicio' | 'configuracion' | 'laboratorio') => {
    window.location.hash = `/${next}`
    setScreen(next)
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })
  }
  function updateGraph(next: GraphInput) {
    setGraph(next); setSteps([]); setStepIndex(-1); setPlaying(false); setError(''); setNotice(''); setSelectedEdge(undefined)
  }
  const onConnect = useCallback((connection: Connection) => {
    if (!manual || !connection.source || !connection.target) return
    const id = `e-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    setGraph(g => ({ ...g, edges: [...g.edges, { id, source: connection.source!, target: connection.target!, capacity: 5 }] }))
    setSteps([]); setStepIndex(-1); setPlaying(false); setError('')
  }, [manual])
  function addEdge() {
    const capacity = Number(capacityDraft)
    const realSource = graph.nodes.some(n => n.id === sourceDraft) ? sourceDraft : graph.nodes[0]?.id
    const realTarget = graph.nodes.some(n => n.id === targetDraft) ? targetDraft : graph.nodes.at(-1)?.id
    if (!realSource || !realTarget || realSource === realTarget || !Number.isSafeInteger(capacity) || capacity <= 0) { setError('Selecciona nodos distintos e ingresa una capacidad entera positiva.'); return }
    if (graph.edges.some(e => e.source === realSource && e.target === realTarget)) { setError('Esa conexión ya existe.'); return }
    updateGraph({ ...graph, edges: [...graph.edges, { id: `e-${Date.now()}-${Math.floor(Math.random() * 10000)}`, source: realSource, target: realTarget, capacity }] })
  }
  function updateCapacity(id: string, raw: string) {
    const capacity = Number(raw)
    if (!Number.isSafeInteger(capacity) || capacity <= 0) { setError('La capacidad debe ser un entero positivo.'); return }
    const edge = graph.edges.find(e => e.id === id)
    if (!edge || edge.capacity === capacity) return
    updateGraph({ ...graph, edges: graph.edges.map(e => e.id === id ? { ...e, capacity } : e) })
  }
  function configure() {
    try {
      const next = createGraph(Number(count), mode)
      updateGraph(next)
      setNodes(makeNodes(next)); setShowAllEdges(false)
      goTo('laboratorio')
    } catch { setError('Elige un número entero entre 7 y 16.'); }
  }
  function start() {
    if (validation.length) { setError(validation.join(' ')); return }
    try { const next = buildSimulation(graph); setSteps(next); setStepIndex(0); setPlaying(false); setError(''); setNotice(`Simulación preparada: ${next.length} estados explicativos.`) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo iniciar la simulación.') }
  }
  const goStep = (next: number) => { setPlaying(false); setStepIndex(Math.max(0, Math.min(steps.length - 1, next))) }
  function exportCSV() {
    if (!steps.length) return
    const rows = [['Iteracion', 'Etapa', 'Flujo acumulado', 'Cuello de botella', 'Camino', 'Descripcion'], ...steps.map(s => [
      `${s.iteration}`, s.phase, `${s.totalFlow}`, `${s.path?.bottleneck ?? ''}`, s.path?.nodes.join(' > ') ?? '', s.explanation,
    ])]
    const csv = rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n')
    downloadText('FlowLab-historial.csv', '\ufeff' + csv, 'text/csv')
  }
  const isFinished = !!current?.finished
  const flowSummary = current?.phase === 'FINAL' ? current.totalFlow : maxFlow

  return <AnimatePresence mode="wait">
    {screen === 'inicio' ? <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .25 }}><Welcome enter={() => { setError(''); goTo('configuracion') }}/></motion.div>
      : screen === 'configuracion' ? <motion.main key="setup" className="setup-screen" initial={{opacity:0}} animate={{opacity:1}}>
        <button className="header-text-button" onClick={() => goTo('inicio')}><ArrowLeft size={16}/> Volver al inicio</button>
        <form className="setup-panel" onSubmit={e => {e.preventDefault(); configure()}}>
          <FlowMark size={34}/><span className="panel-index">01 / PREPARAR LA RED</span>
          <h1>Cada red empieza<br/>con una decisión.</h1>
          <label className="setup-count">Cantidad de nodos <span>De 7 a 16 vértices</span><input aria-label="Cantidad de nodos" type="number" min="7" max="16" step="1" required value={count} onChange={e => setCount(e.target.value)}/></label>
          <fieldset className="setup-modes"><legend>Cómo quieres construirla</legend>
            <label className={manual ? 'chosen' : ''}><input type="radio" name="mode" value="manual" checked={manual} onChange={() => setMode('manual')}/><strong>Manual</strong><span>Tú defines las conexiones y sus capacidades.</span></label>
            <label className={!manual ? 'chosen' : ''}><input type="radio" name="mode" value="aleatoria" checked={!manual} onChange={() => setMode('aleatoria')}/><strong>Automática</strong><span>Una red aleatoria, lista para explorar.</span></label>
          </fieldset>
          {error && <p role="alert">{error}</p>}
          <button className="studio-button studio-button-teal full" type="submit">Crear red <ArrowRight size={18}/></button>
        </form>
      </motion.main> : <motion.div key="lab" className="lab-app" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .3 }}>
        <header className="lab-header">
          <button className="lab-brand" onClick={() => goTo('inicio')} aria-label="Volver a portada"><span className="brand-symbol"><FlowMark size={22}/></span><span>FLOW<b>LAB</b><small>LABORATORIO DE GRAFOS</small></span></button>
          <div className="lab-header-center"><span className="header-dot"/> FORD–FULKERSON <span className="header-separator"/> v0.8</div>
          <div className="lab-header-actions"><button className="header-text-button" onClick={() => setShowGuide(true)}><BookOpen size={16}/> Guía</button><button className="header-icon-button mobile-menu" onClick={() => setMobileToolsOpen(v => !v)} aria-label="Mostrar herramientas"><Menu size={20}/></button></div>
        </header>

        <main className="studio-container">
          <div className="studio-intro"><div><div className="studio-eyebrow"><span/> ESPACIO DE TRABAJO <span className="studio-eyebrow-line"/></div><h1>Laboratorio <em>de flujo.</em></h1><p>Construye una red, sigue cada búsqueda y demuestra el teorema de flujo máximo–corte mínimo.</p></div><div className="intro-indicators"><span><Layers3 size={15}/>{graph.nodes.length} nodos</span><span><GitBranch size={15}/>{graph.edges.length} aristas</span></div></div>
          <div className="studio-layout">
            <aside className={`tool-sidebar ${mobileToolsOpen ? 'tools-open' : ''}`}>
              <div className="panel-topline"><div><span className="panel-index">01 / CONFIGURAR</span><h2>Arquitectura de red</h2></div><span className="panel-icon"><Network size={18}/></span></div>
              <div className="network-signature" aria-label={`Red con ${graph.sources.length} fuentes y ${graph.sinks.length} sumideros`}>
                <div className="network-signature-title"><span>PERFIL DE LA RED</span><span>G (V, E)</span></div>
                <div className="network-signature-track"><div><strong>{graph.sources.length.toString().padStart(2, '0')}</strong><span>FUENTES</span></div><div className="network-signature-route"><i/><span>FLUJO</span><i/></div><div><strong>{graph.sinks.length.toString().padStart(2, '0')}</strong><span>SUMIDEROS</span></div></div>
              </div>
              <div className="form-group"><label>VÉRTICES FUENTE <span className="field-help">(varios posibles)</span></label><TerminalChips graph={graph} kind="sources" change={updateGraph}/><small className="field-note"><i className="tiny-dot dot-source"/> Selección actual: {graph.sources.join(', ') || 'Ninguna'}</small></div>
              <div className="form-group"><label>VÉRTICES SUMIDERO <span className="field-help">(varios posibles)</span></label><TerminalChips graph={graph} kind="sinks" change={updateGraph}/><small className="field-note"><i className="tiny-dot dot-sink"/> Selección actual: {graph.sinks.join(', ') || 'Ninguno'}</small></div>
              <div className="panel-divider"/>
              <div className="panel-subtitle"><span className="panel-index">{manual ? '02 / CONSTRUIR' : '02 / EXPLORAR'}</span><h3>{manual ? 'Editor de red' : 'Red automática'}</h3></div>
              <p className="field-note">{graph.nodes.length} nodos · {manual ? 'Conecta los vértices y asigna capacidades.' : 'Selecciona las fuentes y los sumideros para comenzar.'}</p>
              {manual && <>
              <div className="form-group spaced"><label>NUEVA CONEXIÓN</label><div className="link-selectors"><select aria-label="Nodo inicial" value={graph.nodes.some(n => n.id === sourceDraft) ? sourceDraft : graph.nodes[0]?.id} onChange={e => setSourceDraft(e.target.value)}>{graph.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}</select><ArrowRight size={15}/><select aria-label="Nodo final" value={graph.nodes.some(n => n.id === targetDraft) ? targetDraft : graph.nodes.at(-1)?.id} onChange={e => setTargetDraft(e.target.value)}>{graph.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}</select></div></div>
              <div className="form-group compact"><label>CAPACIDAD DE ARISTA</label><input aria-label="Capacidad de nueva arista" type="number" min="1" step="1" value={capacityDraft} onChange={e => setCapacityDraft(e.target.value)}/></div>
              <button className="studio-button studio-button-dark full" onClick={addEdge}><Plus size={16}/> Añadir conexión</button>
              <div className="panel-divider"/>
              </>}
              <button className="studio-button studio-button-quiet full" onClick={() => {setPlaying(false); setError(''); goTo('configuracion')}}><ArrowLeft size={16}/> Volver a configurar</button>
              <div className={`validation-message ${validation.length ? 'invalid' : 'valid'}`}>{validation.length ? <CircleHelp size={17}/> : <ShieldCheck size={17}/>}<span>{validation.length ? validation[0] : 'Red válida y lista para ejecutar.'}</span></div>
              {error && <div className="alert-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Cerrar error"><X size={13}/></button></div>}
              {notice && <div className="alert-notice" role="status">{notice}</div>}
              <button className="studio-button studio-button-teal full run-button" onClick={start}><Play size={16} fill="currentColor"/> {steps.length ? 'Reiniciar simulación' : 'Iniciar simulación'} <ArrowRight size={16}/></button>
            </aside>

            <section className="graph-column">
              <div className="graph-header"><div className="graph-title"><span className="graph-title-icon"><Network size={19}/></span><div><h2>Topología de la red</h2><p>{manual ? 'Editor visual interactivo' : 'Red generada automáticamente'}</p></div></div><div className="graph-status"><span className="status-dot"/>{current?.finished ? 'Finalizada' : current ? 'Simulando' : manual ? 'Lista para editar' : 'Lista para explorar'}</div></div>
              <div className="graph-canvas">
                <ReactFlow nodes={nodes} edges={edges} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onConnect={onConnect} onEdgeClick={(_, edge) => { if (graph.edges.some(e => e.id === edge.id)) setSelectedEdge(edge.id) }} fitView fitViewOptions={{ padding: .23 }} deleteKeyCode={null} nodesDraggable nodesConnectable={manual} elementsSelectable minZoom={.22} maxZoom={1.7}>
                  <Background color="#25364b" gap={22} size={1}/>
                  <Controls showInteractive={false}/>
                  <MiniMap pannable zoomable nodeColor={n => graph.sources.includes(n.id) ? '#41d5b6' : graph.sinks.includes(n.id) ? '#f4ae64' : '#647d99'} maskColor="rgba(4, 12, 22, .74)"/>
                </ReactFlow>
                <div className="canvas-overlay-top"><span><i className="legend-dot dot-source"/> Fuente</span><span><i className="legend-dot dot-sink"/> Sumidero</span><span><i className="legend-dot dot-path"/> Camino</span><span><i className="legend-dot dot-reverse"/> Residual inversa</span></div>
                <div className="canvas-overlay-bottom"><GitBranch size={14}/> {manual ? 'Arrastra nodos · Une conectores para crear aristas' : 'Arrastra nodos para explorar la red'}</div>
                {current && <div className="canvas-phase"><span>ITERACIÓN {current.iteration}</span><strong>{phases[current.phase].name}</strong></div>}
              </div>
              <div className="edge-editor">
                <button className="edge-editor-head" aria-expanded={showAllEdges} onClick={() => setShowAllEdges(v => !v)}><span><GitBranch size={16}/><strong>Conexiones y capacidades</strong><small>{graph.edges.length} aristas</small></span><ChevronDown size={17} className={showAllEdges ? 'rotated' : ''}/></button>
                {showAllEdges ? <div className="edge-editor-list">{graph.edges.map(edge => <div key={edge.id} className={`edge-editor-row ${selectedEdge === edge.id ? 'chosen' : ''}`}><button className="edge-connection" title="Seleccionar arista" onClick={() => setSelectedEdge(edge.id)}>{edge.source}<ArrowRight size={13}/>{edge.target}</button><label>cap. <input readOnly={!manual} aria-label={`Capacidad de ${edge.source} a ${edge.target}`} type="number" min={1} step={1} key={`${edge.id}-${edge.capacity}`} defaultValue={edge.capacity} onBlur={e => updateCapacity(edge.id, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}/></label>{manual && <button className="edge-delete" aria-label={`Eliminar conexión ${edge.source} a ${edge.target}`} title="Eliminar conexión" onClick={() => updateGraph({ ...graph, edges: graph.edges.filter(e => e.id !== edge.id) })}><Trash2 size={15}/></button>}</div>)}</div>
                  : <div className="edge-preview">{graph.edges.slice(0, 9).map(edge => <button type="button" key={edge.id} className={`edge-mini-chip ${selectedEdge === edge.id ? 'selected' : ''}`} onClick={() => { setSelectedEdge(edge.id); setShowAllEdges(true) }}>{edge.source}<ArrowRight size={11}/>{edge.target}<b>{edge.capacity}</b></button>)}{graph.edges.length > 9 && <button onClick={() => setShowAllEdges(true)} className="extra-edges">+ {graph.edges.length - 9} más</button>}</div>}
              </div>
              <section className="matrix-section" aria-label="Matriz de capacidades"><button className="matrix-toggle" aria-expanded={showMatrix} onClick={() => setShowMatrix(v => !v)}><span><Network size={17}/><strong>Matriz de capacidades</strong><small>{graph.nodes.length} × {graph.nodes.length} · vista tabular</small></span><ChevronDown size={18} className={showMatrix ? 'rotated' : ''}/></button>{showMatrix && <div className="matrix-scroll"><table className="capacity-table"><caption>Capacidades por vértice inicial (filas) y final (columnas). Un guion indica ausencia de arista.</caption><thead><tr><th scope="col">DESDE / HASTA</th>{graph.nodes.map(n => <th scope="col" key={n.id}>{n.label}</th>)}</tr></thead><tbody>{graph.nodes.map(from => <tr key={from.id}><th scope="row">{from.label}</th>{graph.nodes.map(to => { const found = graph.edges.find(e => e.source === from.id && e.target === to.id); return <td key={to.id} className={found ? 'matrix-active' : ''}>{found ? found.capacity : from.id === to.id ? '·' : '—'}</td> })}</tr>)}</tbody></table></div>}</section>
              <div className="bfs-panel"><div className="subpanel-title"><div><span className="panel-index">ETIQUETADO</span><h3>Árbol de búsqueda BFS</h3></div><span>{current?.bfsLabels.length ?? 0} etiquetas</span></div>{current?.bfsLabels.length ? <div className="bfs-labels">{current.bfsLabels.map((label: BfsLabel) => <div key={label.node} className="bfs-tag"><strong>{label.node}</strong><span>{label.predecessor ?? 'S*'} <b>{label.sign}</b></span><em>{label.available}</em></div>)}</div> : <p className="subpanel-empty">Aquí aparecerán predecesor, signo y capacidad residual de cada vértice visitado por BFS.</p>}</div>
            </section>

            <aside className="result-sidebar">
              <div className="panel-topline result-topline"><div><span className="panel-index">03 / ANALIZAR</span><h2>Simulación</h2></div><span className={`state-indicator ${isFinished ? 'state-finished' : current ? 'state-running' : ''}`}>{isFinished ? 'FINALIZADO' : current ? 'EN CURSO' : 'EN ESPERA'}</span></div>
              <div className="flow-feature"><span>FLUJO ACUMULADO</span><div className="feature-flow"><motion.strong key={`${stepIndex}-flow`} initial={reducedMotion ? false : { y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .23 }}>{current?.totalFlow ?? 0}</motion.strong><small>unidades</small></div><div className="feature-track"><div style={{ width: `${maxFlow ? Math.min(100, 100 * (current?.totalFlow ?? 0) / maxFlow) : 0}%` }}/></div><small>{isFinished ? `Flujo máximo confirmado: ${maxFlow}` : 'El óptimo se revela al finalizar'}</small></div>
              <div className="detail-stats"><div><span>ITERACIÓN</span><strong>{current?.iteration ?? '—'}</strong></div><div><span>CUELLO DE BOTELLA</span><strong>{current?.path?.bottleneck ?? '—'}</strong></div></div>
              <div className="phase-card"><span>FASE ACTUAL</span><div className="phase-head"><span className="phase-number">{current ? phases[current.phase].number : '—'}</span><h3>{current ? phases[current.phase].name : 'Inicia una simulación'}</h3></div>{!current && <p>Inicia la simulación para recorrer sus etapas.</p>}{current?.path && <div className="path-readout"><span>CAMINO AUMENTANTE</span><strong>{current.path.nodes.join(' → ')}</strong>{current.path.arcs.some(arc => arc.direction === -1) && <small><i className="legend-dot dot-reverse"/> Incluye cancelación de flujo en sentido inverso</small>}</div>}</div>
              <div className="playback"><div className="playback-heading"><strong>Control de pasos</strong><span>{steps.length && stepIndex >= 0 ? `${stepIndex + 1} / ${steps.length}` : '0 / 0'}</span></div><div className="progress-line"><div style={{ width: `${steps.length && stepIndex >= 0 ? (stepIndex + 1) * 100 / steps.length : 0}%` }}/></div><div className="playback-buttons"><button title="Primer paso" aria-label="Primer paso" disabled={!steps.length || stepIndex <= 0} onClick={() => goStep(0)}><SkipBack size={17}/></button><button title="Paso anterior" aria-label="Paso anterior" disabled={!steps.length || stepIndex <= 0} onClick={() => goStep(stepIndex - 1)}><ArrowLeft size={17}/></button><button className="playback-main" title={playing ? 'Pausar' : 'Reproducir automáticamente'} aria-label={playing ? 'Pausar' : 'Reproducir'} disabled={!steps.length || stepIndex === steps.length - 1} onClick={() => setPlaying(v => !v)}>{playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}</button><button title="Siguiente paso" aria-label="Siguiente paso" disabled={!steps.length || stepIndex === steps.length - 1} onClick={() => goStep(stepIndex + 1)}><ArrowRight size={17}/></button><button title="Último paso" aria-label="Último paso" disabled={!steps.length || stepIndex === steps.length - 1} onClick={() => goStep(steps.length - 1)}><SkipForward size={17}/></button></div></div>
              <div className="history-panel"><div className="history-head"><div><Clock3 size={16}/><strong>Historial de iteraciones</strong></div><button onClick={exportCSV} disabled={!steps.length} title="Exportar el historial como CSV"><Download size={15}/></button></div><div className="history-list">{historyIndices.length ? historyIndices.map(({ step, index }) => <button className={`history-entry ${current?.iteration === step.iteration ? 'history-selected' : ''}`} key={index} onClick={() => goStep(index)}><span className="history-index">{String(step.iteration).padStart(2, '0')}</span><span className="history-description"><strong>{step.path?.nodes.join(' → ') || 'Camino'}</strong><small>+{step.path?.bottleneck} flujo · Total {step.totalFlow} {step.path?.arcs.some(a => a.direction === -1) ? '· ↶ inversa' : ''}</small></span><ChevronRight size={15}/></button>) : <p className="history-empty">Aún no hay recorridos. Al ejecutar la red aparecerá el historial completo.</p>}</div></div>
              {isFinished && <div className="final-report"><div className="final-report-heading"><CheckCircle2 size={19}/><strong>Resultado comprobado</strong></div><div className="final-metrics"><div><span>FLUJO MÁXIMO</span><strong>{flowSummary}</strong></div><div><span>CORTE MÍNIMO</span><strong>{current.cutCapacity}</strong></div></div><div className="equality">{flowSummary} = {current.cutCapacity} <Check size={16}/></div><div className="partition"><span>CONJUNTO S</span><strong>{current.reachable.join(', ') || '∅'}</strong></div><div className="partition"><span>CONJUNTO T</span><strong>{graph.nodes.filter(n => !current.reachable.includes(n.id)).map(n => n.id).join(', ') || '∅'}</strong></div><div className="partition"><span>ARISTAS DE CORTE</span><strong>{graph.edges.filter(e => current.cutEdges.includes(e.id)).map(e => `${e.source}→${e.target}`).join(', ') || 'Ninguna'}</strong></div></div>}
            </aside>
          </div>
        </main>
        <footer className="lab-footer"><span>FLOWLAB / MATEMÁTICA COMPUTACIONAL</span><span><Zap size={13}/> FORD–FULKERSON · BFS · FLUJO MÁXIMO</span><button onClick={() => goTo('inicio')}>Volver al inicio <ArrowRight size={13}/></button></footer>
        <AnimatePresence>{showGuide && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGuide(false)} role="presentation"><motion.div className="guide-modal" initial={reducedMotion ? false : { y: 30, scale: .97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="guide-title" onClick={event => event.stopPropagation()}><div className="guide-header"><div><span className="panel-index">GUÍA DE USO</span><h2 id="guide-title">Cómo funciona FlowLab</h2></div><button onClick={() => setShowGuide(false)} aria-label="Cerrar guía"><X size={20}/></button></div><div className="guide-content"><p>El algoritmo Ford–Fulkerson encuentra un flujo máximo en una red. Esta implementación usa búsqueda en anchura (BFS), también conocida como variante Edmonds–Karp, y admite varias fuentes y sumideros mediante vértices ficticios internos.</p><ol><li><strong>Construye la red.</strong> Elige entre 7 y 16 nodos y un modo de creación. En modo manual, define conexiones y capacidades enteras positivas. Puedes seleccionar múltiples fuentes y sumideros.</li><li><strong>Ejecuta BFS.</strong> Las etiquetas muestran predecesor, signo (+ directo / − inverso) y capacidad residual que limita el recorrido.</li><li><strong>Encuentra un camino.</strong> Se destaca la ruta y su cuello de botella sin alterar aún el flujo.</li><li><strong>Actualiza el flujo.</strong> Las aristas directas suman y las inversas restan flujo previo. El color morado conserva también el historial de regresos.</li><li><strong>Valida el óptimo.</strong> Cuando no existen más caminos aumentantes, se determina el corte mínimo y se verifica que su capacidad coincida con el flujo máximo.</li></ol><div className="guide-note"><ShieldCheck size={18}/><span>Para cambiar la cantidad de nodos o el modo, usa «Volver a configurar».</span></div></div><button className="studio-button studio-button-dark" onClick={() => setShowGuide(false)}>Entendido <Check size={16}/></button></motion.div></motion.div>}</AnimatePresence>
      </motion.div>}
  </AnimatePresence>
}
