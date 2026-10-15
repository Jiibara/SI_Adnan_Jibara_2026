import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader } from '@/components/UI'
import {
  notasServicoApi, clientesApi, condicoesApi, servicosApi,
  cidadesApi, estadosApi, paisesApi, formaPagamentosApi,
} from '@/services/api'
import { useModalGuard } from '@/hooks/useModalGuard'
const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const fo = e => e.target.style.borderColor = '#2563eb'
const bl = e => e.target.style.borderColor = '#e2e6ed'
const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }
const tdStyle = { padding: '11px 14px', color: '#0f172a' }
const fmtMoney = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const arredondar2 = v => Math.round((Number(v) + Number.EPSILON) * 100) / 100
const toDateInput = v => v ? String(v).slice(0, 10) : ''
const hoje = () => new Date().toISOString().slice(0, 10)
const chaveNota = (numero, modelo, serie, codCliente) => `${numero}/${modelo}/${serie}/${codCliente}`
const addDias = (dataStr, dias) => {
  if (!dataStr) return null
  const d = new Date(`${dataStr}T00:00:00`)
  d.setDate(d.getDate() + (Number(dias) || 0))
  return d
}
const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)
const ModalBox = ({ children, maxWidth = 760 }) => (
  <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)', animation: 'slideUp .2s ease' }}>
    {children}
  </div>
)
const ModalHeader = ({ title, badge, onClose }) => (
  <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
      {badge}
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
  </div>
)
const BtnPrimary = ({ onClick, disabled, children, style }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: disabled ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: disabled ? .7 : 1, ...style }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = '.85')}
    onMouseLeave={e => e.currentTarget.style.opacity = disabled ? '.7' : '1'}>
    {children}
  </button>
)
const BtnSecondary = ({ onClick, children, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ padding: '8px 18px', border: '1px solid #e2e6ed', borderRadius: 8, background: 'transparent', cursor: disabled ? 'default' : 'pointer', fontSize: 13, color: '#475569', opacity: disabled ? .6 : 1 }}>
    {children}
  </button>
)
const BtnNovo = ({ onClick, label }) => (
  <BtnPrimary onClick={onClick} style={{ marginTop: 6, padding: '4px 12px', fontSize: 12 }}>+ {label}</BtnPrimary>
)
const SaveRow = ({ onCancel, onSave, saving, label }) => (
  <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
    <BtnSecondary onClick={onCancel}>Cancelar</BtnSecondary>
    <BtnPrimary onClick={onSave} disabled={saving}>{saving ? 'Salvando...' : label}</BtnPrimary>
  </div>
)
const BtnPesquisar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    style={{ padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: disabled ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, background: disabled ? '#f1f4f8' : '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: disabled ? '#94a3b8' : '#0f172a' }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' } }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = disabled ? '#94a3b8' : '#0f172a' }}>
    Pesquisar
  </button>
)
const LookupField = ({ label, value, onSearch, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ display: 'flex', gap: 8 }}>
      <input type="text" readOnly value={value ?? ''} style={{ ...inp, width: '100%', paddingRight: 42, background: disabled ? '#f1f4f8' : inp.background }} />
      <BtnPesquisar onClick={onSearch} disabled={disabled} />
    </div>
  </div>
)
const Inp = ({ label, value, onChange, maxLength, placeholder, style, disabled }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="text" value={value ?? ''} maxLength={maxLength} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background, color: disabled ? '#94a3b8' : inp.color }}
      onFocus={fo} onBlur={bl} />
  </div>
)
const NumberField = ({ label, value, onChange, step = '1', min, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="number" step={step} min={min} disabled={disabled} value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      onFocus={e => { fo(e); e.target.select() }}
      onBlur={bl}
      style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background, color: disabled ? '#94a3b8' : inp.color }} />
  </div>
)
const formatDateBR = value => {
  const iso = toDateInput(value)
  if (!iso || iso.length !== 10) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
const parseDateBR = value => {
  const texto = String(value ?? '').trim()
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, dia, mes, ano] = match
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia))
  if (
    data.getFullYear() !== Number(ano) ||
    data.getMonth() !== Number(mes) - 1 ||
    data.getDate() !== Number(dia)
  ) return null
  return `${ano}-${mes}-${dia}`
}
const DateField = ({ label = 'Data', value, onChange, disabled, min, max, style }) => {
  const [texto, setTexto] = useState(formatDateBR(value))
  const calendarioRef = useRef(null)
  useEffect(() => {
    setTexto(formatDateBR(value))
  }, [value])
  const abrirCalendario = () => {
    if (disabled) return
    if (calendarioRef.current?.showPicker) {
      calendarioRef.current.showPicker()
    } else {
      calendarioRef.current?.click()
    }
  }
  const selecionarData = data => {
    if (!data) return
    if (min && data < min) return
    if (max && data > max) return
    setTexto(formatDateBR(data))
    onChange(data)
  }
  const alterarTexto = valor => {
    const limpo = valor.replace(/\D/g, '').slice(0, 8)
    let formatado = limpo
    if (limpo.length > 4)
      formatado = `${limpo.slice(0, 2)}/${limpo.slice(2, 4)}/${limpo.slice(4)}`
    else if (limpo.length > 2)
      formatado = `${limpo.slice(0, 2)}/${limpo.slice(2)}`
    setTexto(formatado)
  }
  const finalizarTexto = () => {
    if (!texto) {
      onChange('')
      return
    }
    const data = parseDateBR(texto)
    if (!data) {
      setTexto(formatDateBR(value))
      toast.error(`Informe uma data válida no formato DD/MM/AAAA.`)
      return
    }
    if (min && data < min) {
      setTexto(formatDateBR(value))
      toast.error(`A data não pode ser anterior a ${formatDateBR(min)}.`)
      return
    }
    if (max && data > max) {
      setTexto(formatDateBR(value))
      toast.error(`A data não pode ser posterior a ${formatDateBR(max)}.`)
      return
    }
    onChange(data)
  }
  return (
    <div style={style}>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={texto}
          placeholder="DD/MM/AAAA"
          maxLength={10}
          onChange={e => alterarTexto(e.target.value)}
          onBlur={e => {
            bl(e)
            finalizarTexto()
          }}
          onFocus={fo}
          style={{ ...inp, width: '100%', paddingRight: 42, background: disabled ? '#f1f4f8' : inp.background }}
        />
        <button
          type="button"
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={abrirCalendario}
          aria-label={`Selecionar ${label.toLowerCase()}`}
          style={{
            position: 'absolute',
            right: 1,
            top: 1,
            width: 38,
            height: 'calc(100% - 2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: '#475569',
            cursor: disabled ? 'default' : 'pointer',
            padding: 0,
            borderRadius: 7
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
        <input
          ref={calendarioRef}
          type="date"
          disabled={disabled}
          value={toDateInput(value)}
          min={min}
          max={max}
          onChange={e => selecionarData(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
            left: 0,
            bottom: 0
          }}
        />
      </div>
    </div>
  )
}
const SelectField = ({ label, value, onChange, options, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <select disabled={disabled} value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background }}
      onFocus={fo} onBlur={bl}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)
const ReadOnlyField = ({ label, value, style, bold }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ ...inp, background: '#eef2f7', color: '#0f172a', fontWeight: bold ? 700 : 400, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
  </div>
)
const TextAreaField = ({ label, value, onChange, rows = 2, style, disabled }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <textarea rows={rows} value={value ?? ''} disabled={disabled} onChange={e => onChange(e.target.value)}
      style={{ ...inp, resize: 'vertical', fontFamily: 'Outfit, sans-serif', background: disabled ? '#f1f4f8' : inp.background }}
      onFocus={fo} onBlur={bl} />
  </div>
)
const CheckAtivo = ({ checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
    Ativo
  </label>
)
const InlineForm = ({ title, children }) => (
  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e6ed', background: '#f8faff' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</span>
    </div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>{children}</div>
  </div>
)
const AvisoChavesPendentes = () => (
  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e6ed', background: '#fff7ed', color: '#b45309', fontSize: 13, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
    ⚠ Preencha Número, Série, Modelo e selecione o Cliente antes de adicionar itens.
  </div>
)
const LookupTable = ({ cols, rows, onSelect }) => (
  <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
            {cols.map(c => <th key={c.key} style={thStyle}>{c.label}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length + 1} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {cols.map(c => (
                <td key={c.key} style={{ ...tdStyle, fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                  {c.render ? c.render(row) : String(row[c.key] ?? '')}
                </td>
              ))}
              <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                <button onClick={() => onSelect(row)}
                  style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Selecionar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)
const ItemsList = ({ items, onRemove, podeRemover }) => (
  <div style={{ padding: '0 24px 20px' }}>
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
            <th style={thStyle}>Serviço</th>
            <th style={thStyle}>Duração</th>
            <th style={thStyle}>Quantidade</th>
            <th style={thStyle}>Vlr. Unit.</th>
            <th style={thStyle}>Desconto %</th>
            <th style={thStyle}>Desconto R$</th>
            <th style={thStyle}>Vlr. Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>
                Nenhum serviço adicionado.
              </td>
            </tr>
          )}
          {items.map((it, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
              <td style={tdStyle}>{it.servicoNome || `Serviço #${it.codServico}`}</td>
              <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.duracaoMinutos ? `${it.duracaoMinutos} min` : '-'}</td>
              <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.quantidade}</td>
              <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(it.valorUnitario)}</td>
              <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>
                {Number(it.descontoPercentual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
              </td>
              <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(it.descontoValor)}</td>
              <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmtMoney(it.valorTotal)}</td>
              <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                <button onClick={() => podeRemover && onRemove(i)} disabled={!podeRemover}
                  style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: podeRemover ? '#fee2e2' : '#f1f4f8', color: podeRemover ? '#dc2626' : '#94a3b8', cursor: podeRemover ? 'pointer' : 'default', fontSize: 12, fontWeight: 600 }}>
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #e2e6ed', background: '#f8f9fb' }}>
            <td colSpan={6} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right' }}>VALOR TOTAL DOS SERVIÇOS</td>
            <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{fmtMoney(items.reduce((s, it) => s + (Number(it.valorTotal) || 0), 0))}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
)
const ParcelasGridEditavel = ({ parcelas, valorTotalNota, onChangeParcela, onGerar, condicaoLabel, onSearchCondicao, podeGerar, condicaoDisabled }) => (
  <div style={{ padding: '4px 24px 20px' }}>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'flex-end', marginBottom: 8 }}>
      <LookupField
        label="Condição de Pagamento"
        value={condicaoLabel}
        onSearch={onSearchCondicao}
        disabled={condicaoDisabled}
        style={{ width: 320 }}
      />
      <BtnPrimary onClick={onGerar} disabled={!podeGerar} style={{ padding: '9px 16px', fontSize: 12 }}>
        Gerar Parcelas
      </BtnPrimary>
    </div>
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
            <th style={thStyle}>Parcela</th>
            <th style={thStyle}>Vencimento</th>
            <th style={thStyle}>Percentual</th>
            <th style={thStyle}>Valor</th>
            <th style={thStyle}>Forma de Pagamento</th>
          </tr>
        </thead>
        <tbody>
          {parcelas.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>
              Selecione uma Condição de Pagamento e clique em "Gerar Parcelas".
            </td></tr>
          )}
          {parcelas.map((p, i) => {
            const percentual = Number(valorTotalNota) > 0 ? (Number(p.valor) || 0) / Number(valorTotalNota) * 100 : 0
            return (
              <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{p.numeroParcela}</td>
                <td style={{ ...tdStyle, padding: '6px 14px' }}>
<DateField value={p.vencimento} onChange={v => onChangeParcela(i, 'vencimento', v)} disabled={!parcelas.length} style={{ minWidth: 170 }} />
                </td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>
                  {percentual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                </td>
                <td style={{ ...tdStyle, padding: '6px 14px' }}>
                  <input type="number" step="0.01" min="0" value={p.valor ?? ''} disabled={!parcelas.length}
                    onChange={e => onChangeParcela(i, 'valor', e.target.value === '' ? '' : e.target.value)}
                    onFocus={e => { fo(e); e.target.select() }}
                    onBlur={e => {
                      bl(e)
                      if (p.valor !== '' && p.valor !== undefined && p.valor !== null) {
                        const parsed = parseFloat(p.valor)
                        if (!isNaN(parsed)) onChangeParcela(i, 'valor', Number(parsed.toFixed(2)))
                      }
                    }}
                    style={{ ...inp, padding: '6px 8px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
                </td>
                <td style={tdStyle}>{p.formaNome || `#${p.codFormaPagamento}`}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
)
const ParcelasCondicaoEditor = ({ parcelas, onChange, formaPagamentos }) => {
  const total = parcelas.reduce((s, p) => s + (Number(p.percentual) || 0), 0)
  const addLinha = () => {
    onChange([...parcelas, {
      numeroParcela: parcelas.length + 1,
      percentual: 0,
      dias: 30,
      codFormaPagamento: formaPagamentos[0]?.codFormaPagamento ?? null
    }])
  }
  const updLinha = (i, campo, valor) => {
    onChange(parcelas.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p))
  }
  const removeLinha = i => {
    onChange(parcelas.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, numeroParcela: idx + 1 })))
  }
  return (
    <div style={{ flex: '1 1 100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ ...lbl, marginBottom: 0 }}>
          Parcelas {parcelas.length > 0 && `(soma: ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`}
        </label>
        <BtnPrimary onClick={addLinha} style={{ padding: '4px 12px', fontSize: 12 }}>+ Parcela</BtnPrimary>
      </div>
      {parcelas.length === 0 ? (
        <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>Nenhuma parcela adicionada ainda.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {parcelas.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
<ReadOnlyField label="Nº" value={p.numeroParcela} style={{ flex: '0 0 50px' }} />
<NumberField label="Percentual (%)" value={p.percentual} onChange={v => updLinha(i, 'percentual', v)} step="0.01" min="0" style={{ flex: '0 0 130px' }} /> <NumberField label="Dias" value={p.dias} onChange={v => updLinha(i, 'dias', v)} step="1" min="0" style={{ flex: '0 0 90px' }} />
<SelectField label="Forma de Pagamento" value={p.codFormaPagamento} onChange={v => updLinha(i, 'codFormaPagamento', Number(v))} options={formaPagamentos.map(f => ({ value: f.codFormaPagamento, label: f.formaPagamento }))} style={{ flex: '1 1 180px' }} />
              <BtnSecondary onClick={() => removeLinha(i)}>Remover</BtnSecondary>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
const NOTA_EMPTY = {
  numero: '',
  serie: '',
  modelo: '',
  codCliente: null,
  dataEmissao: new Date().toISOString().slice(0, 10),
  valorServicos: 0,
  valorDesconto: 0,
  valorTotal: 0,
  codCondicao: null,
  observacoes: '',
  situacao: 'CONFERIDA',
  servicos: [],
  parcelasGeradas: [],
}
const ITEM_EMPTY = {
  codServico: null,
  servicoNome: '',
  duracaoMinutos: '',
  quantidade: 1,
  valorUnitario: '',
  descontoPercentual: 0,
  descontoValor: 0,
}
const SITUACAO_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONFERIDA', label: 'Conferida' },
  { value: 'CANCELADA', label: 'Cancelada' },
]
const cols = [
  { key: 'numero', label: 'Número', mono: true, align: 'right'  },
  { key: 'serie', label: 'Série', mono: true, align: 'right'  },
  { key: 'modelo', label: 'Modelo', mono: true, align: 'right'  },
  { key: 'cliente', label: 'Cliente', render: r => r.cliente?.cliente ?? r.cliente?.nome ?? `#${r.codCliente}`, align: 'right'  },
  { key: 'dataEmissao', label: 'Emissão', render: r => r.dataEmissao ? new Date(r.dataEmissao).toLocaleDateString('pt-BR') : '', align: 'right'  },
  { key: 'valorTotal', label: 'Valor Total', render: r => fmtMoney(r.valorTotal), align: 'right'  },
  { key: 'situacao', label: 'Situação', align: 'right'  },
]
const colsClientes = [
  { key: 'codCliente', label: 'Cód.', mono: true },
  { key: 'cliente', label: 'Cliente', render: r => r.cliente ?? r.nome ?? r.razaoSocial ?? '' },
  { key: 'cpfCnpj', label: 'CPF/CNPJ', render: r => r.cpfCnpj ?? '' },
]
const colsCondicoes = [
  { key: 'codCondicao', label: 'Cód.', mono: true },
  { key: 'condicaoPagamento', label: 'Descrição' },
]
const colsServicos = [
  { key: 'codServico', label: 'Cód.', mono: true },
  { key: 'servico', label: 'Serviço' },
  { key: 'duracaoMinutos', label: 'Duração', render: r => `${r.duracaoMinutos} min` },
  { key: 'preco', label: 'Preço', render: r => fmtMoney(r.preco) },
]
const colsCidades = [
  { key: 'codCidade', label: 'Cód.', mono: true },
  { key: 'cidade', label: 'Cidade' },
  { key: 'estado', label: 'Estado', render: r => r.estado?.uf ?? '' },
]
const colsEstados = [
  { key: 'codEstado', label: 'Cód.', mono: true },
  { key: 'estado', label: 'Estado' },
  { key: 'uf', label: 'UF' },
  { key: 'pais', label: 'País', render: r => r.pais?.pais ?? '' },
]
const colsPaises = [
  { key: 'codPais', label: 'Cód.', mono: true },
  { key: 'pais', label: 'País' },
  { key: 'sigla', label: 'Sigla' },
  { key: 'ddi', label: 'DDI' },
  { key: 'moeda', label: 'Moeda' },
]
const CLIENTE_NOVO_EMPTY = { tipoPessoa: 'PJ', cliente: '', cpfCnpj: '', codCidade: null, ativo: true }
const CIDADE_EMPTY = { cidade: '', ddd: '', codEstado: null, ativo: true }
const ESTADO_EMPTY = { estado: '', uf: '', codPais: null, ativo: true }
const PAIS_EMPTY = { pais: '', sigla: '', ddi: '', moeda: '', ativo: true }
const CONDICAO_NOVA_EMPTY = { condicaoPagamento: '', ativo: true, parcelas: [] }
const SERVICO_NOVO_EMPTY = { servico: '', preco: '', duracaoMinutos: '', ativo: true }
export default function NotaServicoPage() {
  const { data, loading, load } = useCrud(notasServicoApi)
  const [clientes, setClientes] = useState([])
  const [condicoes, setCondicoes] = useState([])
  const [servicos, setServicos] = useState([])
  const [cidades, setCidades] = useState([])
  const [estados, setEstados] = useState([])
  const [paises, setPaises] = useState([])
  const [formaPagamentos, setFormaPagamentos] = useState([])
  const [form, setForm] = useState(NOTA_EMPTY)
  const [originalForm, setOriginalForm] = useState(NOTA_EMPTY)
  const [itemDraft, setItemDraft] = useState(ITEM_EMPTY)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [cancelamentoModo, setCancelamentoModo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [openClientes, setOpenClientes] = useState(false)
  const [openCondicoes, setOpenCondicoes] = useState(false)
  const [openServicos, setOpenServicos] = useState(false)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoCliente, setNovoCliente] = useState(CLIENTE_NOVO_EMPTY)
  const [savingCliente, setSavingCliente] = useState(false)
  const [openCidadesEnd, setOpenCidadesEnd] = useState(false)
  const [showNovaCidade, setShowNovaCidade] = useState(false)
  const [novaCidade, setNovaCidade] = useState(CIDADE_EMPTY)
  const [savingCidade, setSavingCidade] = useState(false)
  const [openEstadosEnd, setOpenEstadosEnd] = useState(false)
  const [showNovoEstado, setShowNovoEstado] = useState(false)
  const [novoEstado, setNovoEstado] = useState(ESTADO_EMPTY)
  const [savingEstado, setSavingEstado] = useState(false)
  const [openPaisesEnd, setOpenPaisesEnd] = useState(false)
  const [showNovoPais, setShowNovoPais] = useState(false)
  const [novoPais, setNovoPais] = useState(PAIS_EMPTY)
  const [savingPais, setSavingPais] = useState(false)

  const [showNovoServico, setShowNovoServico] = useState(false)
  const [novoServicoForm, setNovoServicoForm] = useState(SERVICO_NOVO_EMPTY)
  const [savingServico, setSavingServico] = useState(false)
  const [showNovaCondicao, setShowNovaCondicao] = useState(false)
  const [novaCondicao, setNovaCondicao] = useState(CONDICAO_NOVA_EMPTY)
  const [savingCondicao, setSavingCondicao] = useState(false)
  const loadClientes = async () => setClientes(await clientesApi.getAll())
  const loadCondicoes = async () => setCondicoes(await condicoesApi.getAll())
  const loadServicos = async () => setServicos(await servicosApi.getAll())
  const loadCidades = async () => setCidades(await cidadesApi.getAll())
  const loadEstados = async () => setEstados(await estadosApi.getAll())
  const loadPaises = async () => setPaises(await paisesApi.getAll())
  const loadFormaPagamentos = async () => setFormaPagamentos(await formaPagamentosApi.getAll())
  useEffect(() => {
    loadClientes(); loadCondicoes(); loadServicos()
    loadCidades(); loadEstados(); loadPaises()
    loadFormaPagamentos()
  }, [])
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updNovoCliente = (k, v) => setNovoCliente(p => ({ ...p, [k]: v }))
  const updCidade = (k, v) => setNovaCidade(p => ({ ...p, [k]: v }))
  const updEstado = (k, v) => setNovoEstado(p => ({ ...p, [k]: v }))
  const updPais = (k, v) => setNovoPais(p => ({ ...p, [k]: v }))
  const updNovoServico = (k, v) => setNovoServicoForm(p => ({ ...p, [k]: v }))
  const updDataEmissao = v => {
    if (v && v > hoje()) {
      toast.error('A Data de Emissão não pode ser futura.')
      return
    }
    upd('dataEmissao', v)
  }
  const updItemQuantidade = v => setItemDraft(d => {
    const quantidade = Number(v) || 0
    const valorUnitario = Number(d.valorUnitario) || 0
    const bruto = quantidade * valorUnitario
    const percentual = Number(d.descontoPercentual) || 0
    return { ...d, quantidade: v, descontoValor: arredondar2(bruto * percentual / 100) }
  })
  const updItemValorUnitario = v => setItemDraft(d => {
    const quantidade = Number(d.quantidade) || 0
    const valorUnitario = Number(v) || 0
    const bruto = quantidade * valorUnitario
    const percentual = Number(d.descontoPercentual) || 0
    return { ...d, valorUnitario: v, descontoValor: arredondar2(bruto * percentual / 100) }
  })
  const updItemDescontoPercentual = v => setItemDraft(d => {
    const quantidade = Number(d.quantidade) || 0
    const valorUnitario = Number(d.valorUnitario) || 0
    const bruto = quantidade * valorUnitario
    const percentual = Number(v) || 0
    return { ...d, descontoPercentual: v, descontoValor: arredondar2(bruto * percentual / 100) }
  })
  const updItemDescontoValor = v => setItemDraft(d => {
    const quantidade = Number(d.quantidade) || 0
    const valorUnitario = Number(d.valorUnitario) || 0
    const bruto = quantidade * valorUnitario
    const descontoValor = Number(v) || 0
    const percentual = bruto > 0 ? (descontoValor / bruto) * 100 : 0
    return { ...d, descontoValor: v, descontoPercentual: percentual }
  })
  const selectServicoItem = r => {
    setItemDraft({
      ...ITEM_EMPTY,
      codServico: r.codServico,
      servicoNome: r.servico ?? '',
      duracaoMinutos: r.duracaoMinutos ?? '',
      valorUnitario: Number(r.preco) || 0,
    })
    setOpenServicos(false)
  }
  const addItem = () => {
    if (!itemDraft.codServico) { toast.error('Selecione um serviço.'); return }
    if (!itemDraft.quantidade || Number(itemDraft.quantidade) <= 0) { toast.error('Informe a quantidade.'); return }
    if (!Number.isInteger(Number(itemDraft.quantidade))) { toast.error('A quantidade deve ser um número inteiro.'); return }
    if (itemDraft.valorUnitario === '' || Number(itemDraft.valorUnitario) < 0) { toast.error('Informe o valor unitário.'); return }
    const jaExiste = (form.servicos ?? []).some(s => Number(s.codServico) === Number(itemDraft.codServico))
    if (jaExiste) { toast.error('Este serviço já foi adicionado. Aumente a quantidade dele.'); return }
    const quantidade = Number(itemDraft.quantidade)
    const valorUnitario = Number(itemDraft.valorUnitario)
    const bruto = quantidade * valorUnitario
    const descontoPercentual = Number(itemDraft.descontoPercentual) || 0
    const descontoValor = arredondar2(Number(itemDraft.descontoValor) || 0)
    if (descontoValor < 0) { toast.error('O desconto não pode ser negativo.'); return }
    if (descontoValor > bruto) { toast.error('O desconto não pode ser maior que o valor bruto do item.'); return }
    const novoItem = {
      numero: String(form.numero ?? ''),
      modelo: String(form.modelo ?? ''),
      serie: String(form.serie ?? ''),
      codCliente: Number(form.codCliente),
      codServico: Number(itemDraft.codServico),
      servicoNome: itemDraft.servicoNome,
      duracaoMinutos: itemDraft.duracaoMinutos,
      quantidade,
      valorUnitario,
      valorTotal: arredondar2(bruto - descontoValor),
      descontoPercentual,
      descontoValor,
    }
    setForm(f => ({ ...f, servicos: [...(f.servicos ?? []), novoItem], parcelasGeradas: [] }))
    setItemDraft(ITEM_EMPTY)
  }
  const removeItem = i => {
    setForm(f => ({
      ...f,
      servicos: (f.servicos ?? []).filter((_, idx) => idx !== i),
      parcelasGeradas: [],
    }))
  }
  const valorServicosAtual = arredondar2((form.servicos ?? []).reduce((t, it) => t + (Number(it.valorTotal) || 0), 0))
  const descontoAtual = arredondar2((form.servicos ?? []).reduce((t, it) => t + (Number(it.descontoValor) || 0), 0))
  const valorTotalAtual = valorServicosAtual
  const valorTotalItemDraft = arredondar2((Number(itemDraft.quantidade) || 0) * (Number(itemDraft.valorUnitario) || 0))
  const valorLiquidoItemDraft = arredondar2(valorTotalItemDraft - (Number(itemDraft.descontoValor) || 0))
  const clienteSelecionado = clientes.find(c => Number(c.codCliente) === Number(form.codCliente)) ?? form.cliente
  const clienteLabel = clienteSelecionado?.cliente ?? clienteSelecionado?.nome ?? clienteSelecionado?.razaoSocial ?? ''
  const selectCliente = r => {
    setForm(f => ({
      ...f,
      codCliente: Number(r.codCliente),
      cliente: r,
      codCondicao: r.condicao?.codCondicao ?? null,
      condicaoPagamento: r.condicao ?? null,
    }))
    setOpenClientes(false)
  }
  const condicaoSelecionada = condicoes.find(c => Number(c.codCondicao) === Number(form.codCondicao)) ?? form.condicaoPagamento
  const condicaoLabel = condicaoSelecionada?.condicaoPagamento ?? condicaoSelecionada?.descricao ?? ''
  const selectCondicao = r => {
    setForm(f => ({
      ...f,
      codCondicao: Number(r.codCondicao),
      condicaoPagamento: r,
      parcelasGeradas: []
    }))
    setOpenCondicoes(false)
  }
  const gerarParcelas = async () => {
    if (!form.servicos?.length) {
      toast.error('Adicione ao menos um serviço antes de gerar as parcelas.')
      return
    }
    if (!form.codCondicao) {
      toast.error('Selecione uma Condição de Pagamento antes.')
      return
    }
    if (!form.dataEmissao) {
      toast.error('Informe a Data de Emissão antes.')
      return
    }
    let condicao = condicaoSelecionada
    let configuradas = condicao?.parcelas ?? condicao?.Parcelas ?? []
    if (configuradas.length === 0) {
      try {
        const detalhe = await condicoesApi.getOne(form.codCondicao)
        condicao = detalhe ?? condicao
        configuradas = detalhe?.parcelas ?? detalhe?.Parcelas ?? []
      } catch {
        toast.error('Não foi possível carregar as parcelas da condição de pagamento.')
        return
      }
    }
    if (configuradas.length === 0) {
      toast.error('A condição de pagamento não possui parcelas cadastradas.')
      return
    }
    let geradas = configuradas.map(p => {
      const percentualOriginal = Number(p.percentual ?? p.Percentual) || 0
      const valor = arredondar2(valorTotalAtual * percentualOriginal / 100)
      const dias = Number(p.dias ?? p.Dias) || 0
      const numeroParcela = p.numeroParcela ?? p.NumeroParcela
      const codFormaPagamento = p.codFormaPagamento ?? p.CodFormaPagamento
      const venc = addDias(form.dataEmissao, dias)
      const formaNome = formaPagamentos.find(f => String(f.codFormaPagamento) === String(codFormaPagamento))?.formaPagamento ?? ''
      return {
        numeroParcela,
        vencimento: venc ? venc.toISOString().slice(0, 10) : '',
        percentual: 0,
        valor,
        codFormaPagamento,
        formaNome
      }
    })
    const totalGerado = arredondar2(geradas.reduce((s, p) => s + (Number(p.valor) || 0), 0))
    const diferenca = arredondar2(valorTotalAtual - totalGerado)
    if (geradas.length > 0 && diferenca !== 0) {
      const ultima = geradas.length - 1
      geradas[ultima] = {
        ...geradas[ultima],
        valor: arredondar2(geradas[ultima].valor + diferenca)
      }
    }
    geradas = geradas.map(p => ({
      ...p,
      percentual: valorTotalAtual > 0
        ? arredondar2((Number(p.valor) / valorTotalAtual) * 100)
        : 0
    }))
    setForm(f => ({
      ...f,
      condicaoPagamento: condicao,
      parcelasGeradas: geradas
    }))
  }
  const updParcelaGerada = (i, campo, valor) => {
    setForm(f => ({
      ...f,
      parcelasGeradas: (f.parcelasGeradas ?? []).map((p, idx) =>
        idx === i ? { ...p, [campo]: valor } : p
      )
    }))
  }
  const cidadeNovoClienteLabel = cidades.find(c => c.codCidade === novoCliente.codCidade)?.cidade ?? ''
  const estadoNaCidadeLabel = (() => {
    const e = estados.find(e => e.codEstado === novaCidade.codEstado)
    return e ? `${e.estado} - ${e.uf}` : ''
  })()
  const paisNoEstadoLabel = paises.find(p => p.codPais === novoEstado.codPais)?.pais ?? ''
  const abrirCidadesPara = () => {
    setShowNovaCidade(false)
    setOpenCidadesEnd(true)
  }
  const saveNovoCliente = async () => {
    if (!novoCliente.cliente?.trim()) { toast.error('Informe o cliente.'); return }
    if (!novoCliente.codCidade) { toast.error('Selecione a cidade.'); return }
    setSavingCliente(true)
    try {
      const created = await clientesApi.create(novoCliente)
      toast.success('Cliente cadastrado!')
      await loadClientes()
      const codNovo = created?.codCliente ?? created?.id
      if (codNovo) {
        selectCliente({
          ...novoCliente,
          codCliente: codNovo,
          condicao: null
        })
      }
      setShowNovoCliente(false)
      setNovoCliente(CLIENTE_NOVO_EMPTY)
    } catch {
      toast.error('Erro ao salvar cliente.')
    } finally {
      setSavingCliente(false)
    }
  }
  const saveNovaCidade = async () => {
    if (!novaCidade.cidade?.trim()) { toast.error('Informe a cidade.'); return }
    setSavingCidade(true)
    try {
      const created = await cidadesApi.create(novaCidade)
      toast.success('Cidade cadastrada!')
      await loadCidades()
      const codNovo = created?.codCidade ?? created?.id
      if (codNovo) updNovoCliente('codCidade', codNovo)
      setShowNovaCidade(false)
      setNovaCidade(CIDADE_EMPTY)
    } catch {
      toast.error('Erro ao salvar cidade.')
    } finally {
      setSavingCidade(false)
    }
  }
  const saveNovoEstado = async () => {
    if (!novoEstado.estado?.trim()) { toast.error('Informe o estado.'); return }
    setSavingEstado(true)
    try {
      const created = await estadosApi.create(novoEstado)
      toast.success('Estado cadastrado!')
      await loadEstados()
      const codNovo = created?.codEstado ?? created?.id
      if (codNovo) updCidade('codEstado', codNovo)
      setShowNovoEstado(false)
      setNovoEstado(ESTADO_EMPTY)
    } catch {
      toast.error('Erro ao salvar estado.')
    } finally {
      setSavingEstado(false)
    }
  }
  const saveNovoPais = async () => {
    if (!novoPais.pais?.trim()) { toast.error('Informe o país.'); return }
    setSavingPais(true)
    try {
      const created = await paisesApi.create(novoPais)
      toast.success('País cadastrado!')
      await loadPaises()
      const codNovo = created?.codPais ?? created?.id
      if (codNovo) updEstado('codPais', codNovo)
      setShowNovoPais(false)
      setNovoPais(PAIS_EMPTY)
    } catch {
      toast.error('Erro ao salvar país.')
    } finally {
      setSavingPais(false)
    }
  }
  const cancelClienteNovo = () => {
    setShowNovoCliente(false)
    setNovoCliente(CLIENTE_NOVO_EMPTY)
  }
  const cancelCidade = () => {
    setShowNovaCidade(false)
    setNovaCidade(CIDADE_EMPTY)
  }
  const cancelEstado = () => {
    setShowNovoEstado(false)
    setNovoEstado(ESTADO_EMPTY)
  }
  const cancelPais = () => {
    setShowNovoPais(false)
    setNovoPais(PAIS_EMPTY)
  }
  const cancelCondicaoNova = () => {
    setShowNovaCondicao(false)
    setNovaCondicao(CONDICAO_NOVA_EMPTY)
  }
  const closeClientes = () => {
    setOpenClientes(false)
    cancelClienteNovo()
  }
  const closeCidadesEnd = () => {
    setOpenCidadesEnd(false)
    cancelCidade()
  }
  const closeEstadosEnd = () => {
    setOpenEstadosEnd(false)
    cancelEstado()
  }
  const closePaisesEnd = () => {
    setOpenPaisesEnd(false)
    cancelPais()
  }
  const closeCondicoes = () => {
    setOpenCondicoes(false)
    cancelCondicaoNova()
  }
  const isDirtyNovoCliente = showNovoCliente && JSON.stringify(novoCliente) !== JSON.stringify(CLIENTE_NOVO_EMPTY)
  const clientesGuard = useModalGuard({
    isOpen: openClientes,
    isDirty: isDirtyNovoCliente,
    onClose: closeClientes,
    onSave: showNovoCliente ? saveNovoCliente : undefined,
    paused: openCidadesEnd,
  })
  const isDirtyCidade = showNovaCidade && JSON.stringify(novaCidade) !== JSON.stringify(CIDADE_EMPTY)
  const cidadesEndGuard = useModalGuard({
    isOpen: openCidadesEnd,
    isDirty: isDirtyCidade,
    onClose: closeCidadesEnd,
    onSave: showNovaCidade ? saveNovaCidade : undefined,
    paused: openEstadosEnd,
  })
  const isDirtyEstado = showNovoEstado && JSON.stringify(novoEstado) !== JSON.stringify(ESTADO_EMPTY)
  const estadosEndGuard = useModalGuard({
    isOpen: openEstadosEnd,
    isDirty: isDirtyEstado,
    onClose: closeEstadosEnd,
    onSave: showNovoEstado ? saveNovoEstado : undefined,
    paused: openPaisesEnd,
  })
  const isDirtyPais = showNovoPais && JSON.stringify(novoPais) !== JSON.stringify(PAIS_EMPTY)
  const paisesEndGuard = useModalGuard({
    isOpen: openPaisesEnd,
    isDirty: isDirtyPais,
    onClose: closePaisesEnd,
    onSave: showNovoPais ? saveNovoPais : undefined,
  })
  const saveNovoServico = async () => {
    const nome = novoServicoForm.servico?.trim()
    const preco = Number(novoServicoForm.preco)
    const duracao = Number(novoServicoForm.duracaoMinutos)
    if (!nome) { toast.error('Informe o serviço.'); return }
    if (!(preco > 0)) { toast.error('Informe um preço maior que zero.'); return }
    if (!Number.isInteger(duracao) || duracao <= 0) { toast.error('Informe a duração em minutos (número inteiro).'); return }
    setSavingServico(true)
    try {
      const body = { ...novoServicoForm, servico: nome, preco, duracaoMinutos: duracao }
      const created = await servicosApi.create(body)
      toast.success('Serviço cadastrado!')
      await loadServicos()
      const codNovo = created?.codServico ?? created?.id
      if (codNovo) {
        selectServicoItem({
          codServico: codNovo,
          servico: nome,
          duracaoMinutos: duracao,
          preco,
        })
      }
      setShowNovoServico(false)
      setNovoServicoForm(SERVICO_NOVO_EMPTY)
    } catch {
      toast.error('Erro ao salvar serviço.')
    } finally {
      setSavingServico(false)
    }
  }
  const cancelServicoNovo = () => {
    setShowNovoServico(false)
    setNovoServicoForm(SERVICO_NOVO_EMPTY)
  }
  const closeServicos = () => {
    setOpenServicos(false)
    cancelServicoNovo()
  }
  const isDirtyNovoServico = showNovoServico && JSON.stringify(novoServicoForm) !== JSON.stringify(SERVICO_NOVO_EMPTY)
  const servicosGuard = useModalGuard({
    isOpen: openServicos,
    isDirty: isDirtyNovoServico,
    onClose: closeServicos,
    onSave: showNovoServico ? saveNovoServico : undefined,
  })
  const saveNovaCondicao = async () => {
    if (!novaCondicao.condicaoPagamento?.trim()) { toast.error('Informe a descrição da condição.'); return }
    if (novaCondicao.parcelas.length === 0) { toast.error('Adicione ao menos uma parcela.'); return }
    setSavingCondicao(true)
    try {
      const created = await condicoesApi.create(novaCondicao)
      toast.success('Condição de pagamento cadastrada!')
      await loadCondicoes()
      const codNovo = created?.codCondicao ?? created?.id
      if (codNovo) {
        selectCondicao({
          ...novaCondicao,
          codCondicao: codNovo
        })
      }
      setShowNovaCondicao(false)
      setNovaCondicao(CONDICAO_NOVA_EMPTY)
    } catch {
      toast.error('Erro ao salvar condição de pagamento.')
    } finally {
      setSavingCondicao(false)
    }
  }
  const isDirtyCondicao = showNovaCondicao && JSON.stringify(novaCondicao) !== JSON.stringify(CONDICAO_NOVA_EMPTY)
  const condicoesGuard = useModalGuard({
    isOpen: openCondicoes,
    isDirty: isDirtyCondicao,
    onClose: closeCondicoes,
    onSave: showNovaCondicao ? saveNovaCondicao : undefined,
  })
  const anyLookupOpen = openClientes || openCondicoes || openServicos
  const abrirNovaNota = () => {
    const nova = { ...NOTA_EMPTY, dataEmissao: hoje() }
    setForm(nova)
    setOriginalForm(nova)
    setItemDraft(ITEM_EMPTY)
    setEditing(false)
    setOpen(true)
  }
  const abrirEdicaoNota = async (r, modoCancelamento = false) => {
    try {
      const completa = await notasServicoApi.getOne(
        chaveNota(r.numero, r.modelo, r.serie, r.codCliente)
      )
      const formCarregado = {
        ...completa,
        numero: String(completa.numero ?? ''),
        serie: String(completa.serie ?? ''),
        modelo: String(completa.modelo ?? ''),
        codCliente: Number(completa.codCliente),
        dataEmissao: toDateInput(completa.dataEmissao),
        valorServicos: Number(completa.valorServicos) || 0,
        valorDesconto: Number(completa.valorDesconto) || 0,
        valorTotal: Number(completa.valorTotal) || 0,
        codCondicao: completa.codCondicao ? Number(completa.codCondicao) : null,
        servicos: (completa.servicos ?? []).map(s => {
          const servico = s.servico ?? s.Servico ?? {}
          return {
            numero: String(s.numero ?? completa.numero ?? ''),
            modelo: String(s.modelo ?? completa.modelo ?? ''),
            serie: String(s.serie ?? completa.serie ?? ''),
            codCliente: Number(s.codCliente ?? completa.codCliente),
            codServico: Number(s.codServico),
            servicoNome: servico.servico ?? servico.Servico ?? `Serviço #${s.codServico}`,
            duracaoMinutos: servico.duracaoMinutos ?? '',
            quantidade: Number(s.quantidade) || 0,
            valorUnitario: Number(s.valorUnitario) || 0,
            valorTotal: Number(s.valorTotal) || 0,
            descontoPercentual: Number(s.descontoPercentual) || 0,
            descontoValor: Number(s.descontoValor) || 0,
          }
        }),
        parcelasGeradas: completa.parcelasGeradas ?? [],
      }
      setForm(formCarregado)
      setOriginalForm(formCarregado)
      setItemDraft(ITEM_EMPTY)
      setEditing(true)
      setOpen(true)
      setMotivoCancelamento('')
      setCancelamentoModo(modoCancelamento)
    } catch {
      toast.error('Erro ao carregar a nota.')
    }
  }
  const confirmarNota = async p => {
    const url = `/api/NotasServico/confirmar/${encodeURIComponent(p.numero)}/${encodeURIComponent(p.modelo)}/${encodeURIComponent(p.serie)}/${encodeURIComponent(p.codCliente)}`
    const response = await fetch(url, { method: 'PUT' })
    if (!response.ok) {
      const mensagem = await response.text()
      throw new Error(mensagem || 'Erro ao confirmar a nota.')
    }
  }
  const save = async () => {
    if (!form.codCliente) { toast.error('Selecione o cliente.'); return }
    if (!form.numero || !form.serie || !form.modelo) { toast.error('Informe número, série e modelo.'); return }
    if (!form.dataEmissao) { toast.error('Informe a data de emissão.'); return }
    if (form.dataEmissao > hoje()) { toast.error('A Data de Emissão não pode ser futura.'); return }
    if (!form.servicos || form.servicos.length === 0) { toast.error('Adicione ao menos um serviço.'); return }
    if (form.servicos.some(s => !s.quantidade || Number(s.quantidade) <= 0)) {
      toast.error('Todos os serviços devem possuir quantidade maior que zero.')
      return
    }
    if (form.servicos.some(s => !Number.isInteger(Number(s.quantidade)))) {
      toast.error('A quantidade dos serviços deve ser inteira.')
      return
    }
    const situacaoAnterior = String(originalForm?.situacao ?? 'PENDENTE').toUpperCase()
    const situacaoNova = String(form.situacao ?? 'PENDENTE').toUpperCase()
    if (editing && situacaoAnterior === 'CONFERIDA' && situacaoNova !== 'CONFERIDA') {
      toast.error('Uma nota conferida não pode voltar para Pendente ou Cancelada.')
      return
    }
    if (situacaoNova === 'CONFERIDA') {
      if (!form.codCondicao) { toast.error('Selecione a Condição de Pagamento para conferir a nota.'); return }
      if (valorTotalAtual <= 0) { toast.error('O valor total da nota deve ser maior que zero.'); return }
    }
    const payload = {
      ...form,
      numero: String(form.numero ?? ''),
      serie: String(form.serie ?? ''),
      modelo: String(form.modelo ?? ''),
      codCliente: Number(form.codCliente),
      dataEmissao: form.dataEmissao,
      valorServicos: valorServicosAtual,
      valorDesconto: descontoAtual,
      valorTotal: valorTotalAtual,
      codCondicao: form.codCondicao ? Number(form.codCondicao) : null,
      observacoes: form.observacoes || null,
      situacao: situacaoNova,
      servicos: form.servicos.map(item => ({
        numero: String(item.numero ?? form.numero ?? ''),
        modelo: String(item.modelo ?? form.modelo ?? ''),
        serie: String(item.serie ?? form.serie ?? ''),
        codCliente: Number(item.codCliente ?? form.codCliente),
        codServico: Number(item.codServico),
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.valorUnitario) || 0,
        valorTotal: Number(item.valorTotal) || 0,
        descontoPercentual: Number(item.descontoPercentual) || 0,
        descontoValor: Number(item.descontoValor) || 0,
      })),
    }
    delete payload.parcelasGeradas
    setSaving(true)
    try {
      const chave = chaveNota(payload.numero, payload.modelo, payload.serie, payload.codCliente)
      if (editing) {
        if (situacaoAnterior === 'PENDENTE' && situacaoNova === 'CONFERIDA') {
          await notasServicoApi.update(chave, { ...payload, situacao: 'PENDENTE' })
          await confirmarNota(payload)
        } else {
          await notasServicoApi.update(chave, payload)
        }
      } else {
        await notasServicoApi.create({ ...payload, situacao: 'PENDENTE' })
        if (situacaoNova === 'CONFERIDA') await confirmarNota(payload)
      }
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch (error) {
      toast.error(error?.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }
  const cancelarNota = async () => {
    if (!form?.numero || !form?.modelo || !form?.serie || !form?.codCliente) return
    if (!motivoCancelamento.trim()) { toast.error('Informe o motivo do cancelamento.'); return }

    setSaving(true)
    try {
      const numero = encodeURIComponent(String(form.numero ?? ''))
      const modelo = encodeURIComponent(String(form.modelo ?? ''))
      const serie = encodeURIComponent(String(form.serie ?? ''))
      const codCliente = encodeURIComponent(String(form.codCliente ?? ''))

      const response = await fetch(
        `/api/NotasServico/cancelar/${numero}/${modelo}/${serie}/${codCliente}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            motivoCancelamento: motivoCancelamento.trim(),
          }),
        }
      )

      if (!response.ok) {
        const mensagem = await response.text()
        throw new Error(mensagem || 'Erro ao cancelar a nota.')
      }

      toast.success('Nota cancelada.')
      setOpen(false)
      setMotivoCancelamento('')
      setCancelamentoModo(false)
      load()
    } catch (error) {
      toast.error(error?.message || 'Erro ao cancelar a nota.')
    } finally {
      setSaving(false)
    }
  }

  const chavePronta = !!form.numero && !!form.serie && !!form.modelo && !!form.codCliente
  const possuiItens = (form.servicos ?? []).length > 0
  const parcelasGeradas = (form.parcelasGeradas ?? []).length > 0
  const podeEditarNota = !editing || form.situacao === 'PENDENTE'
  const bloquearChave = cancelamentoModo || possuiItens || parcelasGeradas || !podeEditarNota
  const bloquearTudo = cancelamentoModo || parcelasGeradas || !podeEditarNota
  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  return (
    <div>
      <PageHeader title="Notas de Serviço" sub="Consulta de Notas de Serviço" label="Nova Nota" onNew={abrirNovaNota} disabled={open} />
      <DataTable
        columns={cols}
        data={data}
        loading={loading}
        onDelete={r => abrirEdicaoNota(r, true)}
        deleteLabel="Cancelar"
        canDelete={r => String(r.situacao ?? '').toUpperCase() !== 'CANCELADA'}
      />
      <Modal
        open={open}
        title={cancelamentoModo ? 'Cancelar Nota de Serviço' : (editing ? 'Editar Nota de Serviço' : 'Nova Nota de Serviço')}
        editing={editing}
        cancelMode={cancelamentoModo}
        onClose={() => { setOpen(false); setMotivoCancelamento(''); setCancelamentoModo(false) }}
        onSave={cancelamentoModo ? cancelarNota : save}
        wide
        maxWidth={2000}
        isDirty={cancelamentoModo ? !!motivoCancelamento.trim() : isDirty}
        suspended={anyLookupOpen}
      >
        {cancelamentoModo && (
          <div style={{ padding: '0 24px 16px', borderBottom: '1px solid #e2e6ed', marginBottom: 4 }}>
            <TextAreaField label="Motivo do Cancelamento *" value={motivoCancelamento} onChange={setMotivoCancelamento} rows={3} />
          </div>
        )}
        <div style={{ padding: '18px 24px 0', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Inp label="Modelo" value={form.modelo} onChange={v => upd('modelo', v)} disabled={bloquearChave} style={{ flex: '0 0 80px' }} />
          <Inp label="Série" value={form.serie} onChange={v => upd('serie', v)} disabled={bloquearChave} style={{ flex: '0 0 70px' }} />
          <Inp label="Número" value={form.numero} onChange={v => upd('numero', v)} disabled={bloquearChave} style={{ flex: '0 0 110px' }} />
          <div style={{ flex: '0 0 105px' }}>
            <label style={lbl}>Código</label>
            <input type="text" value={form.codCliente ?? ''} readOnly
              style={{ ...inp, background: '#eef2f7', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }} />
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <LookupField label="Cliente *" value={clienteLabel} disabled={bloquearChave} onSearch={() => { setShowNovoCliente(false); setOpenClientes(true) }} />
          </div>
          <DateField label="Data Emissão" value={form.dataEmissao} onChange={updDataEmissao} disabled={bloquearChave} max={hoje()} style={{ flex: '0 0 150px' }} />
        </div>
        {!chavePronta && !cancelamentoModo && <AvisoChavesPendentes />}
        {chavePronta && podeEditarNota && !parcelasGeradas && !cancelamentoModo && (
          <InlineForm title="Adicionar Serviço">
            <div style={{ flex: '1 1 260px', minWidth: 220 }}>
              <LookupField label="Serviço *" value={itemDraft.servicoNome} onSearch={() => { setShowNovoServico(false); setOpenServicos(true) }} />
            </div>
            <ReadOnlyField label="Duração" value={itemDraft.duracaoMinutos ? `${itemDraft.duracaoMinutos} min` : '-'} style={{ flex: '0 0 100px' }} />
            <NumberField label="Quantidade" value={itemDraft.quantidade} onChange={updItemQuantidade} step="1" min="1" style={{ flex: '0 0 110px' }} />
            <NumberField label="Valor Unitário" value={itemDraft.valorUnitario} onChange={updItemValorUnitario} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
            <NumberField label="Desconto (%)" value={itemDraft.descontoPercentual} onChange={updItemDescontoPercentual} step="0.01" min="0" style={{ flex: '0 0 110px' }} />
            <NumberField label="Desconto (R$)" value={itemDraft.descontoValor} onChange={updItemDescontoValor} step="0.01" min="0" style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Valor Bruto" value={fmtMoney(valorTotalItemDraft)} style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Valor Líquido" value={fmtMoney(valorLiquidoItemDraft)} style={{ flex: '0 0 140px' }} />
            <BtnPrimary onClick={addItem} style={{ padding: '9px 20px' }}>
              Adicionar
            </BtnPrimary>
          </InlineForm>
        )}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
            Serviços da Nota
          </div>
        </div>
        <ItemsList
          items={form.servicos ?? []}
          onRemove={removeItem}
          podeRemover={podeEditarNota && !parcelasGeradas && !cancelamentoModo}
        />
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <SelectField label="Situação" value={form.situacao} onChange={v => upd('situacao', v)} options={SITUACAO_OPTIONS.filter(o => o.value !== 'CANCELADA' || form.situacao === 'CANCELADA')} disabled={bloquearTudo || form.situacao === 'CONFERIDA'} style={{ flex: '0 0 180px' }} />
        </div>
        <div style={{ padding: '14px 24px 4px' }}>
          <TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} disabled={bloquearTudo} />
        </div>
        <div style={{ padding: '4px 24px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <ReadOnlyField label="Valor Serviços" value={fmtMoney(valorServicosAtual)} style={{ flex: '1 1 150px' }} />
          <ReadOnlyField label="Total Descontos" value={fmtMoney(descontoAtual)} style={{ flex: '1 1 150px' }} />
          <ReadOnlyField label="Valor Total da Nota" value={fmtMoney(valorTotalAtual)} bold style={{ flex: '1 1 170px' }} />
        </div>
        <ParcelasGridEditavel
          parcelas={form.parcelasGeradas ?? []}
          valorTotalNota={valorTotalAtual}
          onChangeParcela={updParcelaGerada}
          onGerar={gerarParcelas}
          condicaoLabel={condicaoLabel}
          onSearchCondicao={() => { setShowNovaCondicao(false); setOpenCondicoes(true) }}
          podeGerar={!!condicaoSelecionada && possuiItens && !parcelasGeradas && podeEditarNota}
          condicaoDisabled={bloquearTudo}
        />
      </Modal>
      {openClientes && (
        <Overlay onClose={clientesGuard.attemptClose} zIndex={60}>
          <ModalBox maxWidth={640}>
            <ModalHeader
              title="Consulta de Clientes"
              onClose={clientesGuard.attemptClose}
              badge={!showNovoCliente && <BtnNovo onClick={() => setShowNovoCliente(true)} label="Novo Cliente" />}
            />
            {showNovoCliente && (
              <InlineForm title="Novo Cliente">
                <Inp
                  label="Cliente *"
                  value={novoCliente.cliente}
                  onChange={v => updNovoCliente('cliente', v)}
                  placeholder="Razão social / nome"
                  style={{ flex: '1 1 220px' }}
                />
                <Inp
                  label={novoCliente.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
                  value={novoCliente.cpfCnpj}
                  onChange={v => updNovoCliente('cpfCnpj', v)}
                  style={{ flex: '1 1 180px' }}
                />
<LookupField label="Cidade *" value={cidadeNovoClienteLabel} onSearch={() => abrirCidadesPara('cliente')} style={{ flex: '1 1 200px' }} />
<CheckAtivo checked={novoCliente.ativo} onChange={v => updNovoCliente('ativo', v)} />
                <SaveRow
                  onCancel={cancelClienteNovo}
                  onSave={saveNovoCliente}
                  saving={savingCliente}
                  label="Salvar Cliente"
                />
              </InlineForm>
            )}
            <LookupTable cols={colsClientes} rows={clientes} onSelect={selectCliente} />
          </ModalBox>
        </Overlay>
      )}
      {openCidadesEnd && (
        <Overlay onClose={cidadesEndGuard.attemptClose} zIndex={70}>
          <ModalBox maxWidth={680}>
            <ModalHeader
              title="Consulta de Cidades"
              onClose={cidadesEndGuard.attemptClose}
              badge={!showNovaCidade && <BtnNovo onClick={() => setShowNovaCidade(true)} label="Nova Cidade" />}
            />
            {showNovaCidade && (
              <InlineForm title="Nova Cidade">
                <Inp
                  label="Cidade *"
                  value={novaCidade.cidade}
                  onChange={v => updCidade('cidade', v)}
                  placeholder="Nome da cidade"
                  style={{ flex: '1 1 200px' }}
                />
                <Inp
                  label="DDD"
                  value={novaCidade.ddd}
                  onChange={v => updCidade('ddd', v)}
                  maxLength={3}
                  placeholder="11"
                  style={{ flex: '0 0 72px' }}
                />
<LookupField label="Estado *" value={estadoNaCidadeLabel} onSearch={() => { setShowNovoEstado(false); setOpenEstadosEnd(true) }} />
<CheckAtivo checked={novaCidade.ativo} onChange={v => updCidade('ativo', v)} />
                <SaveRow
                  onCancel={cancelCidade}
                  onSave={saveNovaCidade}
                  saving={savingCidade}
                  label="Salvar Cidade"
                />
              </InlineForm>
            )}
            <LookupTable
              cols={colsCidades}
              rows={cidades}
              onSelect={r => {
                updNovoCliente('codCidade', r.codCidade)
                setOpenCidadesEnd(false)
              }}
            />
          </ModalBox>
        </Overlay>
      )}
      {openEstadosEnd && (
        <Overlay onClose={estadosEndGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={680}>
            <ModalHeader
              title="Consulta de Estados"
              onClose={estadosEndGuard.attemptClose}
              badge={!showNovoEstado && <BtnNovo onClick={() => setShowNovoEstado(true)} label="Novo Estado" />}
            />
            {showNovoEstado && (
              <InlineForm title="Novo Estado">
                <Inp
                  label="Estado *"
                  value={novoEstado.estado}
                  onChange={v => updEstado('estado', v)}
                  placeholder="Nome do estado"
                  style={{ flex: '1 1 200px' }}
                />
                <Inp
                  label="UF *"
                  value={novoEstado.uf}
                  onChange={v => updEstado('uf', v.toUpperCase())}
                  maxLength={2}
                  placeholder="SP"
                  style={{ flex: '0 0 72px' }}
                />
<LookupField label="País *" value={paisNoEstadoLabel} onSearch={() => { setShowNovoPais(false); setOpenPaisesEnd(true) }} />
<CheckAtivo checked={novoEstado.ativo} onChange={v => updEstado('ativo', v)} />
                <SaveRow
                  onCancel={cancelEstado}
                  onSave={saveNovoEstado}
                  saving={savingEstado}
                  label="Salvar Estado"
                />
              </InlineForm>
            )}
            <LookupTable
              cols={colsEstados}
              rows={estados}
              onSelect={r => {
                updCidade('codEstado', r.codEstado)
                setOpenEstadosEnd(false)
              }}
            />
          </ModalBox>
        </Overlay>
      )}
      {openPaisesEnd && (
        <Overlay onClose={paisesEndGuard.attemptClose} zIndex={90}>
          <ModalBox maxWidth={680}>
            <ModalHeader
              title="Consulta de Países"
              onClose={paisesEndGuard.attemptClose}
              badge={!showNovoPais && <BtnNovo onClick={() => setShowNovoPais(true)} label="Novo País" />}
            />
            {showNovoPais && (
              <InlineForm title="Novo País">
                <Inp
                  label="País *"
                  value={novoPais.pais}
                  onChange={v => updPais('pais', v)}
                  placeholder="Nome do país"
                  style={{ flex: '1 1 200px' }}
                />
                <Inp
                  label="Sigla"
                  value={novoPais.sigla}
                  onChange={v => updPais('sigla', v.toUpperCase())}
                  maxLength={3}
                  placeholder="BR"
                  style={{ flex: '0 0 80px' }}
                />
                <Inp
                  label="DDI"
                  value={novoPais.ddi}
                  onChange={v => updPais('ddi', v)}
                  maxLength={6}
                  placeholder="+55"
                  style={{ flex: '0 0 80px' }}
                />
                <Inp
                  label="Moeda"
                  value={novoPais.moeda}
                  onChange={v => updPais('moeda', v)}
                  maxLength={10}
                  placeholder="BRL"
                  style={{ flex: '1 1 120px' }}
                />
<CheckAtivo checked={novoPais.ativo} onChange={v => updPais('ativo', v)} />
                <SaveRow
                  onCancel={cancelPais}
                  onSave={saveNovoPais}
                  saving={savingPais}
                  label="Salvar País"
                />
              </InlineForm>
            )}
            <LookupTable
              cols={colsPaises}
              rows={paises}
              onSelect={r => {
                updEstado('codPais', r.codPais)
                setOpenPaisesEnd(false)
              }}
            />
          </ModalBox>
        </Overlay>
      )}
      {openCondicoes && (
        <Overlay onClose={condicoesGuard.attemptClose} zIndex={60}>
          <ModalBox maxWidth={760}>
            <ModalHeader
              title="Consulta de Condições de Pagamento"
              onClose={condicoesGuard.attemptClose}
              badge={!showNovaCondicao && <BtnNovo onClick={() => setShowNovaCondicao(true)} label="Nova Condição" />}
            />
            {showNovaCondicao && (
              <InlineForm title="Nova Condição de Pagamento">
                <Inp
                  label="Descrição *"
                  value={novaCondicao.condicaoPagamento}
                  onChange={v => setNovaCondicao(p => ({ ...p, condicaoPagamento: v }))}
                  placeholder="Ex.: 30/60/90 dias"
                  style={{ flex: '1 1 260px' }}
                />
<CheckAtivo checked={novaCondicao.ativo} onChange={v => setNovaCondicao(p => ({ ...p, ativo: v }))} />
                <ParcelasCondicaoEditor
                  parcelas={novaCondicao.parcelas}
                  onChange={parcelas => setNovaCondicao(p => ({ ...p, parcelas }))}
                  formaPagamentos={formaPagamentos}
                />
                <SaveRow
                  onCancel={cancelCondicaoNova}
                  onSave={saveNovaCondicao}
                  saving={savingCondicao}
                  label="Salvar Condição"
                />
              </InlineForm>
            )}
            <LookupTable cols={colsCondicoes} rows={condicoes} onSelect={selectCondicao} />
          </ModalBox>
        </Overlay>
      )}
      {openServicos && (
        <Overlay onClose={servicosGuard.attemptClose} zIndex={70}>
          <ModalBox maxWidth={640}>
            <ModalHeader
              title="Consulta de Serviços"
              onClose={servicosGuard.attemptClose}
              badge={!showNovoServico && <BtnNovo onClick={() => setShowNovoServico(true)} label="Novo Serviço" />}
            />
            {showNovoServico && (
              <InlineForm title="Novo Serviço">
                <Inp
                  label="Serviço *"
                  value={novoServicoForm.servico}
                  onChange={v => updNovoServico('servico', v)}
                  placeholder="Ex.: Corte masculino"
                  maxLength={100}
                  style={{ flex: '1 1 220px' }}
                />
                <NumberField label="Preço (R$) *" value={novoServicoForm.preco} onChange={v => updNovoServico('preco', v)} step="0.01" min="0" style={{ flex: '0 0 130px' }} />
                <NumberField label="Duração (min) *" value={novoServicoForm.duracaoMinutos} onChange={v => updNovoServico('duracaoMinutos', v)} step="1" min="1" style={{ flex: '0 0 130px' }} />
                <CheckAtivo checked={novoServicoForm.ativo} onChange={v => updNovoServico('ativo', v)} />
                <SaveRow
                  onCancel={cancelServicoNovo}
                  onSave={saveNovoServico}
                  saving={savingServico}
                  label="Salvar Serviço"
                />
              </InlineForm>
            )}
            <LookupTable cols={colsServicos} rows={servicos.filter(s => s.ativo)} onSelect={selectServicoItem} />
          </ModalBox>
        </Overlay>
      )}
      <ConfirmDialog
        open={clientesGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={clientesGuard.cancelClose}
        onConfirm={clientesGuard.confirmClose}
      />
      <ConfirmDialog
        open={cidadesEndGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={cidadesEndGuard.cancelClose}
        onConfirm={cidadesEndGuard.confirmClose}
      />
      <ConfirmDialog
        open={estadosEndGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={estadosEndGuard.cancelClose}
        onConfirm={estadosEndGuard.confirmClose}
      />
      <ConfirmDialog
        open={paisesEndGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={paisesEndGuard.cancelClose}
        onConfirm={paisesEndGuard.confirmClose}
      />
      <ConfirmDialog
        open={servicosGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={servicosGuard.cancelClose}
        onConfirm={servicosGuard.confirmClose}
      />
      <ConfirmDialog
        open={condicoesGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={condicoesGuard.cancelClose}
        onConfirm={condicoesGuard.confirmClose}
      />
      <ConfirmDialog
        open={!!confirm}
        name={confirm ? `${confirm.numero}/${confirm.serie}/${confirm.modelo}` : ''}
        onClose={() => setConfirm(null)}
        onConfirm={cancelarNota}
      />
    </div>
  )
}