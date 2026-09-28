import { useEffect } from 'react'
import { useModalGuard } from '@/hooks/useModalGuard'

// ── FField ────────────────────────────────────────────────────────────
export function FField({ label, value, onChange, type = 'text', step, full, required, disabled }) {
  const handleChange = (e) => {
    const raw = e.target.value
    const finalValue = type === 'text' ? raw.toUpperCase() : raw
    onChange(finalValue)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : undefined }}>
      <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        step={step}
        value={value ?? ''}
        onChange={handleChange}
        disabled={disabled}
        style={{
          background: disabled ? '#f1f4f8' : '#f8f9fb',
          border: '1px solid #e2e6ed',
          borderRadius: 8,
          padding: '9px 12px',
          fontSize: 13,
          color: disabled ? '#94a3b8' : '#0f172a',
          fontFamily: 'Outfit, sans-serif',
          outline: 'none',
          width: '100%',
          transition: 'border-color .15s',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={e => {
          if (!disabled) e.target.style.borderColor = '#2563eb'
        }}
        onBlur={e => e.target.style.borderColor = '#e2e6ed'}
      />
    </div>
  )
}

// ── FSelect ───────────────────────────────────────────────────────────
export function FSelect({ label, value, onChange, opts, full, required, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : undefined }}>
      <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}{required && ' *'}
      </label>
      <select
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: disabled ? '#f1f4f8' : '#f8f9fb',
          border: '1px solid #e2e6ed',
          borderRadius: 8,
          padding: '9px 12px',
          fontSize: 13,
          color: disabled ? '#94a3b8' : '#0f172a',
          fontFamily: 'Outfit, sans-serif',
          outline: 'none',
          width: '100%',
          transition: 'border-color .15s',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onFocus={e => {
          if (!disabled) e.target.style.borderColor = '#2563eb'
        }}
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
export function FTextarea({ label, value, onChange, full, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: full ? '1/-1' : undefined }}>
      <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace' }}>{label}</label>
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value.toUpperCase())}
        rows={3}
        disabled={disabled}
        style={{
          background: disabled ? '#f1f4f8' : '#f8f9fb',
          border: '1px solid #e2e6ed',
          borderRadius: 8,
          padding: '9px 12px',
          fontSize: 13,
          color: disabled ? '#94a3b8' : '#0f172a',
          fontFamily: 'Outfit, sans-serif',
          outline: 'none',
          width: '100%',
          resize: 'vertical',
          transition: 'border-color .15s',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={e => {
          if (!disabled) e.target.style.borderColor = '#2563eb'
        }}
        onBlur={e => e.target.style.borderColor = '#e2e6ed'}
      />
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────
// isDirty:    quando true, fechar pede confirmação antes de descartar os dados digitados
export function Modal({ open, title, editing, onClose, onSave, children, wide, maxWidth, hideFooter, isDirty = false, suspended = false }) {
  const { confirming, attemptClose, confirmClose, cancelClose } = useModalGuard({
    isOpen: open, isDirty, onClose, onSave, paused: suspended,
  })

  if (!open) return null

  const computedMaxWidth = maxWidth || (wide ? 760 : 520)
  const isCancelMode = String(title ?? '').toLowerCase().includes('cancelar nota')
  const actionLabel = isCancelMode ? 'Cancelar Nota' : 'Salvar'
  const actionColor = isCancelMode ? '#dc2626' : '#2563eb'

  return (
    <>
      <div
        onClick={e => { if (e.target === e.currentTarget) attemptClose() }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
          backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
      >
        <div style={{
          background: '#fff', borderRadius: 12, width: '100%', maxWidth: computedMaxWidth,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,.15)',
          animation: 'slideUp .2s ease',
        }}>

          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
              {!hideFooter && (
                <span style={{
                  fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px',
                  borderRadius: 100, background: isCancelMode ? '#fee2e2' : editing ? '#dbeafe' : '#dcfce7',
                  color: isCancelMode ? '#b91c1c' : editing ? '#1d4ed8' : '#15803d',
                }}>
                  {isCancelMode ? 'CANCELAR' : editing ? 'ALTERAR' : 'INSERIR'}
                </span>
              )}
            </div>
            <button
              onClick={attemptClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', padding: '2px 6px', borderRadius: 4 }}
            >✕</button>
          </div>

          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>{children}</div>

          {!hideFooter && (
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e6ed', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={attemptClose}
                style={{
                  padding: '8px 18px', border: '1px solid #e2e6ed', borderRadius: 8,
                  background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#475569',
                }}
              >Fechar</button>
              <button
                onClick={onSave}
                style={{
                  padding: '8px 22px', border: 'none', borderRadius: 8,
                  background: actionColor, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >{actionLabel}</button>
            </div>
          )}

        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={cancelClose}
        onConfirm={confirmClose}
      />
    </>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────
// genérico: serve tanto para "confirmar exclusão" (uso original) quanto para
// qualquer outra confirmação (ex: fechar modal com dados não salvos)
export function ConfirmDialog({
  open, onClose, onConfirm,
  title = 'Confirmar Exclusão',
  message, name,
  confirmLabel = '🗑 Excluir',
  confirmColor = '#dc2626',
  icon = '⚠️',
}) {
  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key === 'Enter') { e.preventDefault(); onConfirm() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose, onConfirm])

  if (!open) return null
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
        backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 360,
        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.15)',
        border: '1px solid #fee2e2', animation: 'slideUp .15s ease',
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>
          {message ?? <>Deseja excluir <strong>"{name}"</strong>?<br />Esta ação não pode ser desfeita.</>}
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
              background: confirmColor, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────
export function PageHeader({ title, sub, onNew, label = 'Novo', disabled = false }) {
  useEffect(() => {
    console.log('[PageHeader] listener montado. onNew existe?', !!onNew, 'disabled?', disabled)
    if (!onNew || disabled) return
    const handler = (e) => {
      console.log('[PageHeader] tecla:', e.key)
      if (e.key === '+') {
        e.preventDefault()
        onNew()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNew, disabled])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{title}</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{sub}</p>
      </div>
      {onNew && (
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
      )}
    </div>
  )
}