/** Marca gráfica original: tres ramales que convergen en un sumidero. */
export function FlowMark({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M6 8H15L23 20H33M6 20H33M6 32H15L23 20" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="8" r="3.4" fill="currentColor"/>
    <circle cx="6" cy="20" r="3.4" fill="currentColor"/>
    <circle cx="6" cy="32" r="3.4" fill="currentColor"/>
    <circle cx="33" cy="20" r="4.1" fill="currentColor"/>
  </svg>
}
