/** Marca gráfica original: tres ramales que convergen en un sumidero. */
export function FlowMark({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M6 8C18 8 17 20 28 20H35M6 20H35M6 32C18 32 17 20 28 20M30 15L35 20L30 25" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="8" r="3.4" fill="currentColor"/>
    <circle cx="6" cy="20" r="3.4" fill="currentColor"/>
    <circle cx="6" cy="32" r="3.4" fill="currentColor"/>
    <circle cx="33" cy="20" r="4.1" fill="currentColor"/>
  </svg>
}
