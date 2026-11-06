import { motion, useReducedMotion } from 'motion/react'

/** Diagrama editorial de una red de flujo. Es decorativo: NO representa un resultado calculado. */
const nodes: Array<[string, number, number, 'source' | 'sink' | 'regular']> = [
  ['A', 74, 258, 'source'], ['B', 225, 116, 'regular'], ['C', 235, 406, 'regular'],
  ['D', 395, 187, 'regular'], ['E', 392, 398, 'regular'], ['F', 546, 295, 'regular'],
  ['G', 713, 233, 'sink'],
]

const trails = [
  'M74 258 C130 230 160 139 225 116',
  'M74 258 C135 302 158 389 235 406',
  'M225 116 C300 110 331 163 395 187',
  'M225 116 C340 103 456 244 546 295',
  'M235 406 C300 418 334 405 392 398',
  'M235 406 C340 404 449 326 546 295',
  'M395 187 C468 192 483 270 546 295',
  'M392 398 C450 393 485 330 546 295',
  'M546 295 C625 290 635 233 713 233',
  'M395 187 C526 115 626 157 713 233',
]
const active = [trails[0], trails[2], trails[6], trails[8]]

export function FlowSchematic() {
  const reduced = useReducedMotion()
  return <div className="schematic-wrap" aria-hidden="true">
    <div className="schematic-heading"><span>ESQUEMA DE RED / FIG. 01</span><span>G = (V, E)</span></div>
    <svg className="flow-schematic" viewBox="0 0 790 526" role="presentation" focusable="false">
      <defs>
        <pattern id="fl-grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" fill="none" stroke="#24302e" strokeWidth=".6" />
        </pattern>
        <marker id="fl-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0L7 3.5L0 7" fill="none" stroke="#83928a" strokeWidth="1.2"/>
        </marker>
        <marker id="fl-arrow-active" markerWidth="8" markerHeight="8" refX="6.5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0L7 3.5L0 7" fill="none" stroke="#d8fb6c" strokeWidth="1.5"/>
        </marker>
        <marker id="fl-arrow-back" markerWidth="8" markerHeight="8" refX="6.5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0L7 3.5L0 7" fill="none" stroke="#df9bfa" strokeWidth="1.6"/>
        </marker>
      </defs>
      <rect x="0" y="0" width="790" height="526" fill="url(#fl-grid)"/>
      <g className="schematic-guides"><path d="M32 260H745M393 55V470" /><circle cx="394" cy="259" r="208"/><circle cx="394" cy="259" r="136"/></g>
      {trails.map((d,i) => <path key={i} d={d} fill="none" stroke="#53635e" strokeWidth="1.6" opacity=".5" markerEnd="url(#fl-arrow)"/>) }
      {active.map((d,i) => <motion.path key={`active-${i}`} d={d} fill="none" stroke="#d8fb6c" strokeWidth="2.5" markerEnd="url(#fl-arrow-active)" strokeLinecap="round" initial={reduced ? false : {pathLength:0,opacity:.2}} animate={{pathLength:1,opacity:1}} transition={{duration:1.2,delay:.45+i*.18,ease:'easeOut'}} />)}
      <path d="M392 398 C338 325 337 245 395 187" fill="none" stroke="#df9bfa" strokeWidth="2.6" strokeDasharray="8 9" markerEnd="url(#fl-arrow-back)" className="schematic-reverse"/>
      <g className="schematic-path-annotations">
        <rect x="267" y="118" width="61" height="26" rx="5"/><text x="297" y="135" textAnchor="middle">+ 08</text>
        <rect x="465" y="221" width="61" height="26" rx="5"/><text x="496" y="238" textAnchor="middle">+ 05</text>
        <rect x="305" y="288" width="67" height="26" rx="5" className="reverse-label-bg"/><text x="338" y="305" textAnchor="middle" className="reverse-label-text">↶ − 02</text>
      </g>
      {nodes.map(([id,x,y,kind]) => <g key={id} className={`schematic-node node-${kind}`}>
        <circle cx={x} cy={y} r="20" className="schematic-node-halo" />
        <circle cx={x} cy={y} r="14" className="schematic-node-core" />
        <text x={x} y={y+5} textAnchor="middle">{id}</text>
      </g>)}
      <g className="schematic-side-note"><text x="74" y="308">ORIGEN</text><text x="714" y="277" textAnchor="middle">DESTINO</text></g>
      <g className="schematic-corner"><path d="M18 18H52M18 18V52M738 18H772V52M18 475V509H52M738 509H772V475"/></g>
    </svg>
    <div className="schematic-footer"><span><i className="schematic-legend-flow"/> FLUJO DIRECTO</span><span><i className="schematic-legend-reverse"/> ARISTA RESIDUAL</span><strong>ILUSTRACIÓN CONCEPTUAL</strong></div>
  </div>
}
