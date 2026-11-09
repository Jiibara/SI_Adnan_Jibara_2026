import { lbl, inp, fo, bl, COR_BORDA, DESABILITADO, MONO } from '@/styles/formStyles'

// estilo do campo, com visual de desabilitado quando necessário
const estiloCampo = disabled => (disabled ? { ...inp, ...DESABILITADO } : inp)

export const Inp = ({ label, value, onChange, maxLength, placeholder, style, disabled }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="text" value={value ?? ''} maxLength={maxLength} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange(e.target.value)} style={estiloCampo(disabled)} onFocus={fo} onBlur={bl} />
  </div>
)

export const NumberField = ({ label, value, onChange, step = '1', min, disabled, style, warning }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="number" step={step} min={min} disabled={disabled} value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      onFocus={e => { fo(e); e.target.select() }}
      style={{ ...estiloCampo(disabled), borderColor: warning ? '#f59e0b' : COR_BORDA }}
      onBlur={bl} />
    {warning && (
      <div style={{ fontSize: 11, color: '#b45309', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
        ⚠ {warning}
      </div>
    )}
  </div>
)

export const SelectField = ({ label, value, onChange, options, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled} style={estiloCampo(disabled)} onFocus={fo} onBlur={bl}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

export const TextAreaField = ({ label, value, onChange, rows = 2, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <textarea rows={rows} value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{ ...estiloCampo(disabled), resize: 'vertical' }} onFocus={fo} onBlur={bl} />
  </div>
)

export const ReadOnlyField = ({ label, value, style, bold }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ ...inp, background: '#eef2f7', color: '#0f172a', fontWeight: bold ? 700 : 400, fontFamily: MONO }}>{value}</div>
  </div>
)

export const CheckAtivo = ({ checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
    Ativo
  </label>
)

export const InlineForm = ({ title, children }) => (
  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e6ed', background: '#f8faff' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</span>
    </div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>{children}</div>
  </div>
)
