import { lbl, COR_BORDA, COR_FOCO } from '@/styles/formStyles'

// Botões "Pessoa Física / Pessoa Jurídica".
//  pf, pj   códigos gravados no banco (Clientes usa 'F'/'J'; os outros cadastros 'PF'/'PJ')
//  sem valor, considera Pessoa Física selecionada
export const TipoPessoa = ({ value, onChange, pf = 'PF', pj = 'PJ' }) => {
  const atual = value || pf
  return (
    <div>
      <label style={lbl}>Tipo Pessoa</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {[[pf, 'Pessoa Física'], [pj, 'Pessoa Jurídica']].map(([tipo, texto]) => {
          const sel = atual === tipo
          return (
            <button key={tipo} type="button" onClick={() => onChange(tipo)}
              style={{
                height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, fontFamily: 'Outfit, sans-serif',
                borderColor: sel ? COR_FOCO : COR_BORDA, background: sel ? '#eff6ff' : '#fff', color: sel ? COR_FOCO : '#0f172a',
              }}>
              {texto}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Selo "ALTERAR" / "INSERIR" usado no cabeçalho dos modais
export const BadgeModo = ({ editing }) => (
  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 100, background: editing ? '#dbeafe' : '#dcfce7', color: editing ? '#1d4ed8' : '#15803d' }}>
    {editing ? 'ALTERAR' : 'INSERIR'}
  </span>
)
