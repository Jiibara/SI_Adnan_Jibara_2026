import { useEffect } from 'react'

// ── FField ────────────────────────────────────────────────────────────
export function FField({ label, value, onChange, type = 'text', step, full, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : undefined }}>
      <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}{required && ' *'}
      </label>
      <input
        type={type} step={step} value={value ?? ''} onChange={e => onChange(e.target.value)}
        style={{
          background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8,
          padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif',
          outline: 'none', width: '100%', transition: 'border-color .15s', boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#2563eb'}
        onBlur={e => e.target.style.borderColor = '#e2e6ed'}
      />
    </div>
  )
}

// ── FSelect ───────────────────────────────────────────────────────────
export function FSelect({ label, value, onChange, opts, full, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : undefined }}>
      <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}{required && ' *'}
      </label>
      <select
        value={String(value ?? '')} onChange={e => onChange(e.target.value)}
        style={{
          background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8,
          padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif',
          outline: 'none', width: '100%', transition: 'border-color .15s',
        }}
        onFocus={e => e.target.style.borderColor = '#2563eb'}
        onBlur={e => e.target.style.borderColor = '#e2e6ed'}
      >
        <option value="">— selecione —</option>
        {opts.map(o => <option key={String(o.id)} value={String(o.id)}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── FSep ──────────────────────────────────────────────────────────────
export function FSep({ label }) {
  return (
    <div style={{
      gridColumn: '1/-1', borderTop: '1px solid #e2e6ed', paddingTop: 8, marginTop: 4,
      fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px',
      fontFamily: 'JetBrains Mono, monospace',
    }}>{label}</div>
  )
}

// ── FTextarea ─────────────────────────────────────────────────────────
export function FTextarea({ label, value, onChange, full }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : undefined }}>
      <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace' }}>{label}</label>
      <textarea
        value={value ?? ''} onChange={e => onChange(e.target.value)} rows={3}
        style={{
          background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8,
          padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif',
          outline: 'none', width: '100%', resize: 'vertical', transition: 'border-color .15s',
        }}
        onFocus={e => e.target.style.borderColor = '#2563eb'}
        onBlur={e => e.target.style.borderColor = '#e2e6ed'}
      />
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────
// hideFooter: esconde o rodapé com botões Cancelar/Salvar
//             útil para modais de consulta onde a seleção é feita clicando na linha
export function Modal({ open, title, editing, onClose, onSave, children, wide, hideFooter }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!open) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
        backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: wide ? 760 : 520,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,.15)',
        animation: 'slideUp .2s ease',
      }}>

        {/* header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
            {!hideFooter && (
              <span style={{
                fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px',
                borderRadius: 100, background: editing ? '#dbeafe' : '#dcfce7',
                color: editing ? '#1d4ed8' : '#15803d',
              }}>
                {editing ? 'ALTERAR' : 'INSERIR'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', padding: '2px 6px', borderRadius: 4 }}
          >✕</button>
        </div>

        {/* body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>

        {/* footer — omitido quando hideFooter=true */}
        {!hideFooter && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e6ed', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px', border: '1px solid #e2e6ed', borderRadius: 8,
                background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#475569',
              }}
            >Cancelar</button>
            <button
              onClick={onSave}
              style={{
                padding: '8px 22px', border: 'none', borderRadius: 8,
                background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >Salvar</button>
          </div>
        )}

      </div>
    </div>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────
export function ConfirmDialog({ open, name, onClose, onConfirm }) {
  if (!open) return null
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
        backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 360,
        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.15)',
        border: '1px solid #fee2e2', animation: 'slideUp .15s ease',
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Confirmar Exclusão</div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>
          Deseja excluir <strong>"{name}"</strong>?<br />Esta ação não pode ser desfeita.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', border: '1px solid #e2e6ed', borderRadius: 8,
              background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#475569',
            }}
          >Cancelar</button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px', border: 'none', borderRadius: 8,
              background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >🗑 Excluir</button>
        </div>
      </div>
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────
export function PageHeader({ title, sub, onNew, label = 'Novo' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{title}</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{sub}</p>
      </div>
      <button
        onClick={onNew}
        style={{
          padding: '9px 20px', background: '#2563eb', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        ＋ {label}
      </button>
    </div>
  )
}