import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { lbl, inp, fo, bl, COR_BORDA, DESABILITADO } from '@/styles/formStyles'
import { formatarDataBR, parseDataBR, toDateInput } from '@/utils/date'

// Campo de data em dd/mm/aaaa. value / onChange trabalham com 'AAAA-MM-DD'.
//  digitavel   false (padrão): só calendário. true: também aceita digitar, com máscara
//              e validação ao sair do campo.
//  hideLabel   esconde o rótulo (uso dentro de tabelas); label continua no aria-label
//  inputStyle  ajustes de estilo do input (ex.: padding menor em tabelas)
export const DateField = ({ label, value, onChange, disabled, style, min, max, required = false, hideLabel = false, inputStyle, digitavel = false }) => {
  const inputRef = useRef(null)
  const [texto, setTexto] = useState(formatarDataBR(value))
  useEffect(() => { setTexto(formatarDataBR(value)) }, [value])

  const valorInvalido = !!value && ((min && value < min) || (max && value > max))
  const obrigatorioVazio = required && !value
  const erro = valorInvalido
    ? (min && value < min
        ? `A data não pode ser anterior a ${formatarDataBR(min)}.`
        : `A data não pode ser posterior a ${formatarDataBR(max)}.`)
    : obrigatorioVazio
      ? 'Informe uma data.'
      : ''

  const abrirCalendario = () => {
    if (disabled || !inputRef.current) return
    if (typeof inputRef.current.showPicker === 'function') {
      inputRef.current.showPicker()
    } else {
      inputRef.current.focus()
      inputRef.current.click()
    }
  }

  const alterarTexto = valor => {
    const limpo = valor.replace(/\D/g, '').slice(0, 8)
    let formatado = limpo
    if (limpo.length > 4) formatado = `${limpo.slice(0, 2)}/${limpo.slice(2, 4)}/${limpo.slice(4)}`
    else if (limpo.length > 2) formatado = `${limpo.slice(0, 2)}/${limpo.slice(2)}`
    setTexto(formatado)
  }

  const finalizarTexto = () => {
    if (!texto) { onChange(''); return }
    const data = parseDataBR(texto)
    if (!data) {
      setTexto(formatarDataBR(value))
      toast.error('Informe uma data válida no formato DD/MM/AAAA.')
      return
    }
    if (min && data < min) {
      setTexto(formatarDataBR(value))
      toast.error(`A data não pode ser anterior a ${formatarDataBR(min)}.`)
      return
    }
    if (max && data > max) {
      setTexto(formatarDataBR(value))
      toast.error(`A data não pode ser posterior a ${formatarDataBR(max)}.`)
      return
    }
    onChange(data)
  }

  return (
    <div style={style}>
      {!hideLabel && <label style={lbl}>{label}{required ? ' *' : ''}</label>}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          inputMode={digitavel ? 'numeric' : undefined}
          value={digitavel ? texto : formatarDataBR(value)}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          readOnly={!digitavel}
          required={required}
          disabled={disabled}
          onChange={digitavel ? e => alterarTexto(e.target.value) : undefined}
          onClick={digitavel ? undefined : abrirCalendario}
          onFocus={fo}
          onBlur={e => { bl(e); if (digitavel) finalizarTexto() }}
          style={{
            ...inp,
            paddingRight: 38,
            ...(disabled ? DESABILITADO : null),
            borderColor: erro ? '#dc2626' : COR_BORDA,
            cursor: disabled ? 'not-allowed' : digitavel ? 'text' : 'pointer',
            ...inputStyle,
          }}
        />
        <button
          type="button"
          aria-label={`Abrir calendário de ${label}`}
          title="Abrir calendário"
          onMouseDown={e => e.preventDefault()}
          onClick={abrirCalendario}
          disabled={disabled}
          style={{
            position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 25, height: 25, padding: 0, border: 0, borderRadius: 5,
            background: 'transparent', color: disabled ? '#94a3b8' : '#475569',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="date"
          lang="pt-BR"
          value={toDateInput(value)}
          min={min || undefined}
          max={max || undefined}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          onChange={e => {
            const novaData = e.target.value
            if (novaData && ((min && novaData < min) || (max && novaData > max))) return
            onChange(novaData)
          }}
          style={{
            position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
            width: 29, height: 29, opacity: 0, cursor: disabled ? 'not-allowed' : 'pointer',
            pointerEvents: 'none',
          }}
        />
      </div>
      {erro && (
        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
          {erro}
        </div>
      )}
    </div>
  )
}
