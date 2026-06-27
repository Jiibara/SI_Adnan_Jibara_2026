import { useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { condicoesApi, formaPagamentosApi } from '@/services/api'

const lbl = { fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1.2px', fontFamily:'JetBrains Mono, monospace', display:'block', marginBottom:5 }
const inp = { background:'#f8f9fb', border:'1px solid #e2e6ed', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#0f172a', fontFamily:'Outfit, sans-serif', outline:'none', width:'100%', boxSizing:'border-box', transition:'border-color .15s', appearance:'none' }

const empty = { condicaoPagamento:'', numeroParcelas:1, percentualJuros:0, percentualMultas:0, percentualDesconto:0, ativo:true, parcelas:[] }

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', backdropFilter:'blur(4px)', zIndex, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
    {children}
  </div>
)

const ModalBox = ({ children, maxWidth = 860 }) => (
  <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.15)', animation:'slideUp .2s ease' }}>
    {children}
  </div>
)

const ModalHeader = ({ title, badge, onClose }) => (
  <div style={{ padding:'18px 24px', borderBottom:'1px solid #e2e6ed', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
    <div>
      <div style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>{title}</div>
      {badge}
    </div>
    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#94a3b8' }}>✕</button>
  </div>
)

const focusInp = e => e.target.style.borderColor = '#2563eb'
const blurInp  = e => e.target.style.borderColor = '#e2e6ed'

export default function CondicoesPagamentoPage() {
  const { data, loading, load } = useCrud(condicoesApi)
  const [formaPagamentos, setFormaPagamentos] = useState([])
  const [form, setForm]                       = useState(empty)
  const [editing, setEditing]                 = useState(false)
  const [open, setOpen]                       = useState(false)
  const [confirm, setConfirm]                 = useState(null)
  const [numParcelasInput, setNumParcelasInput] = useState('1')

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const gerarParcelas = n => {
    const qtd = parseInt(n) || 0
    if (qtd < 1) return
    setForm(p => {
      const antigas = p.parcelas ?? []
      const base    = parseFloat((100 / qtd).toFixed(2))
      const ajuste  = parseFloat((100 - base * (qtd - 1)).toFixed(2))
      const novas   = Array.from({ length: qtd }, (_, i) => ({
        parcela:           i + 1,
        percentual:        String(i === qtd - 1 ? ajuste : base),
        dias:              antigas[i]?.dias ?? (i + 1) * 30,
        codFormaPagamento: antigas[i]?.codFormaPagamento ?? ''
      }))
      return { ...p, numeroParcelas: qtd, parcelas: novas }
    })
  }

  // Atualiza só o campo editado — sem redistribuir automaticamente
  const updParcela = (i, k, v) => setForm(p => ({
    ...p,
    parcelas: p.parcelas.map((x, idx) => idx === i ? { ...x, [k]: v } : x)
  }))

  // Valida se dias estão em ordem crescente
  const diasForaDeOrdem = (form.parcelas ?? []).some((p, i, arr) =>
    i > 0 && parseInt(p.dias) <= parseInt(arr[i - 1].dias)
  )

  const totalPercentual = (form.parcelas ?? []).reduce((s, p) => s + (parseFloat(p.percentual) || 0), 0)
  const totalOk = Math.abs(totalPercentual - 100) < 0.01

  const save = async () => {
    if (!totalOk) return toast.error(`Total dos percentuais é ${totalPercentual.toFixed(2)}%. Deve ser 100%.`)
    if (diasForaDeOrdem) return toast.error('Os dias das parcelas devem estar em ordem crescente.')
    try {
      const payload = {
        ...form,
        parcelas: form.parcelas.map(p => ({
          numeroParcela:     parseInt(p.parcela) || 0,
          percentual:        parseFloat(p.percentual) || 0,
          dias:              parseInt(p.dias) || 0,
          codFormaPagamento: parseInt(p.codFormaPagamento) || 0,
        }))
      }
      editing ? await condicoesApi.update(form.codCondicao, payload) : await condicoesApi.create(payload)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try { await condicoesApi.delete(confirm.codCondicao); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const openModal = async (r = null) => {
    const fps = await formaPagamentosApi.getAll()
    setFormaPagamentos(fps.filter(f => f.ativo))
    if (r) {
      setForm({
        ...r,
        parcelas: (r.parcelas ?? []).map((p, i) => ({
          parcela:           p.numeroParcela ?? i + 1,
          percentual:        String(p.percentual ?? 0),
          dias:              p.dias ?? (i + 1) * 30,
          codFormaPagamento: String(p.codFormaPagamento ?? ''),
        }))
      })
      setNumParcelasInput(String(r.numeroParcelas ?? ''))
      setEditing(true)
    } else {
      setForm(empty); setNumParcelasInput('1'); setEditing(false)
    }
    setOpen(true)
  }

  const cols = [
    { key:'codCondicao',         label:'Cód.',       mono:true },
    { key:'condicaoPagamento',   label:'Condição de Pagamento' },
    { key:'numeroParcelas',      label:'Parcelas' },
    { key:'percentualDesconto',  label:'Desconto %' },
    { key:'percentualMultas',    label:'Multa %' },
    { key:'percentualJuros',     label:'Juros %' },
    { key:'ativo',               label:'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  return (
    <div>
      <PageHeader title="Condições de Pagamento" sub="Consulta de condições de pagamento" label="Nova Condição"
        onNew={() => openModal()} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => openModal(r)} onDelete={r => setConfirm(r)} />

      {open && (
        <Overlay onClose={() => setOpen(false)}>
          <ModalBox>
            <ModalHeader
              title={editing ? 'Editar Condição de Pagamento' : 'Nova Condição de Pagamento'}
              onClose={() => setOpen(false)}
              badge={
                <span style={{ fontSize:11, fontFamily:'JetBrains Mono, monospace', padding:'2px 8px', borderRadius:100, background: editing ? '#dbeafe':'#dcfce7', color: editing ? '#1d4ed8':'#15803d' }}>
                  {editing ? 'ALTERAR' : 'INSERIR'}
                </span>
              }
            />

            <div style={{ padding:24, flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>

              {/* Linha 1: Código + Condição + Parcelas + Ativo */}
              <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
                <div style={{ flex:'0 0 70px' }}>
                  <FField label="Código" value={editing ? String(form.codCondicao ?? '') : '—'} onChange={() => {}} />
                </div>
                <div style={{ flex:'1 1 280px' }}>
                  <FField label="Condição de Pagamento" required value={form.condicaoPagamento ?? ''} onChange={v => upd('condicaoPagamento', v)} />
                </div>
                <div style={{ flex:'0 0 120px' }}>
                  <label style={lbl}>Nº de Parcelas</label>
                  <input type="number" min={1} value={numParcelasInput} style={inp}
                    onChange={e => { setNumParcelasInput(e.target.value); if (e.target.value !== '') gerarParcelas(e.target.value) }}
                    onFocus={focusInp} onBlur={blurInp} />
                </div>
                <div style={{ flex:'0 0 90px', display:'flex', alignItems:'center', height:38, marginBottom:1 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, fontFamily:'Outfit, sans-serif', color:'#0f172a', userSelect:'none' }}>
                    <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)} style={{ width:16, height:16, cursor:'pointer' }} />
                    Ativo
                  </label>
                </div>
              </div>

              {/* Linha 2: Desconto + Multa + Juros */}
              <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
                {[['Desconto %','percentualDesconto'],['Multa %','percentualMultas'],['Juros %','percentualJuros']].map(([label, key]) => (
                  <div key={key} style={{ flex:'1 1 130px', maxWidth:160 }}>
                    <label style={lbl}>{label}</label>
                    <input type="number" step="0.01" value={form[key] ?? ''} style={inp}
                      onChange={e => upd(key, e.target.value === '' ? '' : parseFloat(e.target.value))}
                      onFocus={focusInp} onBlur={blurInp} />
                  </div>
                ))}
              </div>

              {/* Tabela de Parcelas */}
              {(form.parcelas ?? []).length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', marginTop:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <label style={lbl}>Parcelas</label>
                    <div style={{ display:'flex', gap:12 }}>
                      {diasForaDeOrdem && (
                        <span style={{ fontSize:11, color:'#ef4444', fontFamily:'JetBrains Mono, monospace', fontWeight:600 }}>
                          ⚠ Dias fora de ordem crescente
                        </span>
                      )}
                      {!totalOk && (
                        <span style={{ fontSize:11, color:'#ef4444', fontFamily:'JetBrains Mono, monospace', fontWeight:600 }}>
                          ⚠ Total: {totalPercentual.toFixed(2)}% (deve ser 100%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }}>
                          {['Parcela','Percentual (%)','Dias','Forma de Pagamento'].map(h => (
                            <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'1.2px', color:'#94a3b8' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {form.parcelas.map((p, i) => {
                          const diasInvalido = i > 0 && parseInt(p.dias) <= parseInt(form.parcelas[i - 1].dias)
                          return (
                            <tr key={i} style={{ borderBottom:'1px solid #f1f4f8' }}
                              onMouseEnter={e => e.currentTarget.style.background='#f8f9fb'}
                              onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                              <td style={{ padding:'8px 14px', color:'#94a3b8', fontFamily:'JetBrains Mono, monospace', fontSize:12 }}>{p.parcela}</td>

                              <td style={{ padding:'6px 14px' }}>
                                <input type="text" inputMode="decimal" value={p.percentual}
                                  style={{ ...inp, width:100, textAlign:'right' }}
                                  onChange={e => updParcela(i, 'percentual', e.target.value)}
                                  onFocus={focusInp} onBlur={blurInp} />
                              </td>

                              <td style={{ padding:'6px 14px' }}>
                                <input type="number" value={p.dias}
                                  style={{ ...inp, width:80, textAlign:'right', borderColor: diasInvalido ? '#ef4444' : '#e2e6ed' }}
                                  onChange={e => updParcela(i, 'dias', e.target.value)}
                                  onFocus={focusInp}
                                  onBlur={e => { if (!diasInvalido) blurInp(e) }} />
                              </td>

                              <td style={{ padding:'6px 14px' }}>
                                <select value={String(p.codFormaPagamento ?? '')}
                                  onChange={e => updParcela(i, 'codFormaPagamento', e.target.value)}
                                  style={inp} onFocus={focusInp} onBlur={blurInp}>
                                  <option value="">Selecione...</option>
                                  {formaPagamentos.map(f => (
                                    <option key={f.codFormaPagamento} value={String(f.codFormaPagamento)}>{f.formaPagamento}</option>
                                  ))}
                                </select>
                              </td>

                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            <div style={{ padding:'14px 24px', borderTop:'1px solid #e2e6ed', display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={() => setOpen(false)} style={{ padding:'8px 18px', border:'1px solid #e2e6ed', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:13, color:'#475569' }}>Cancelar</button>
              <button onClick={save} style={{ padding:'8px 22px', border:'none', borderRadius:8, background:'#2563eb', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Salvar</button>
            </div>
          </ModalBox>
        </Overlay>
      )}

      <ConfirmDialog open={!!confirm} name={confirm?.condicaoPagamento} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}