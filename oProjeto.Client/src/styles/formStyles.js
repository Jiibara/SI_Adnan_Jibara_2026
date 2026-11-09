// Estilos compartilhados por formulários, tabelas e modais.
export const COR_BORDA = '#e2e6ed'
export const COR_FOCO = '#2563eb'
export const MONO = 'JetBrains Mono, monospace'

export const DESABILITADO = { background: '#f1f4f8', color: '#94a3b8' }

export const lbl = {
  fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px',
  fontFamily: MONO, display: 'block', marginBottom: 5,
}

export const inp = {
  background: '#f8f9fb', border: `1px solid ${COR_BORDA}`, borderRadius: 8, padding: '9px 12px',
  fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none',
  width: '100%', boxSizing: 'border-box', transition: 'border-color .15s',
}

// Handlers de foco/saída para destacar a borda do campo
export const fo = e => { e.target.style.borderColor = COR_FOCO }
export const bl = e => { e.target.style.borderColor = COR_BORDA }

// Tabelas: cabeçalho/célula normais e alinhados à direita (valores numéricos)
export const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }
export const tdStyle = { padding: '11px 14px', color: '#0f172a' }
export const thRight = { ...thStyle, textAlign: 'right' }
export const tdRight = { ...tdStyle, textAlign: 'right', fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }
