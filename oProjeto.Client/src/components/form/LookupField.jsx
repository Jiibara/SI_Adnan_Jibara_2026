import { lbl, inp } from '@/styles/formStyles'

export const BtnPesquisar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    style={{ padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: disabled ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, background: disabled ? '#f1f4f8' : '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: disabled ? '#94a3b8' : '#0f172a' }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' } }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = disabled ? '#94a3b8' : '#0f172a' }}>
    Pesquisar
  </button>
)

// Campo somente leitura + botão "Pesquisar" que abre um modal de consulta.
export const LookupField = ({ label, value, onSearch, disabled, style }) => (
  <div style={style}>
    {label ? <label style={lbl}>{label}</label> : null}
    <div style={{ display: 'flex', gap: 8 }}>
      <input type="text" readOnly value={value ?? ''} style={{ ...inp, flex: 1, background: disabled ? '#f1f4f8' : inp.background }} />
      <BtnPesquisar onClick={onSearch} disabled={disabled} />
    </div>
  </div>
)
