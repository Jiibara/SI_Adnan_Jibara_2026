import { useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import { useModalGuard } from '@/hooks/useModalGuard'
import DataTable from '@/components/DataTable'
import { ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { BtnPrimary, BtnSecondary, Inp, NumberField, CheckAtivo, LookupField } from '@/components/form'
import LookupModal from '@/components/lookup/LookupModal'
import ConfirmFechar from '@/components/lookup/ConfirmFechar'
import { Overlay, ModalBox, ModalHeader } from '@/components/lookup/ModalBase'
import { condicoesApi, formaPagamentosApi } from '@/services/api'
import { lbl, inp, fo, bl, thStyle, tdStyle, COR_BORDA, MONO } from '@/styles/formStyles'
import { colsFormasPagamento, FORMA_PAGAMENTO_NOVA_EMPTY } from '@/constants/cadastros'
import { gerarParcelasIguais, somaPercentuais, percentuaisFecham100, diasForaDeOrdem } from '@/utils/condicao'

const empty = { condicaoPagamento: '', numeroParcelas: 1, percentualJuros: 0, percentualMultas: 0, percentualDesconto: 0, ativo: true, parcelas: [] }

const cols = [
  { key: 'codCondicao', label: 'Cód.', mono: true },
  { key: 'condicaoPagamento', label: 'Condição de Pagamento' },
  { key: 'numeroParcelas', label: 'Parcelas' },
  { key: 'percentualDesconto', label: 'Desconto %' },
  { key: 'percentualMultas', label: 'Multa %' },
  { key: 'percentualJuros', label: 'Juros %' },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

export default function CondicoesPagamentoPage() {
  const { data, loading, load } = useCrud(condicoesApi)
  const [formaPagamentos, loadFormas] = useLista(formaPagamentosApi)

  const [form, setForm] = useState(empty)
  const [originalForm, setOriginalForm] = useState(empty)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [numParcelasInput, setNumParcelasInput] = useState('1')
  const [parcelaFormaIdx, setParcelaFormaIdx] = useState(null)   // parcela que está escolhendo a forma
  const { abrir, fechar, isOpen, modal } = useModais()

  const carregarFormasPagamento = async () => {
    try {
      await loadFormas()
    } catch {
      toast.error('Erro ao carregar formas de pagamento.')
    }
  }

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const updParcela = (i, k, v) => setForm(p => ({
    ...p,
    parcelas: p.parcelas.map((x, idx) => idx === i ? { ...x, [k]: v } : x),
  }))

  const gerarParcelas = n => {
    const qtd = parseInt(n) || 0
    if (qtd < 1) return
    setForm(p => ({ ...p, numeroParcelas: qtd, parcelas: gerarParcelasIguais(qtd, p.parcelas ?? []) }))
  }

  const parcelasForaDeOrdem = diasForaDeOrdem(form.parcelas)
  const totalPercentual = somaPercentuais(form.parcelas)
  const totalOk = percentuaisFecham100(form.parcelas)

  // ----- formas de pagamento (consulta com cadastro rápido)
  const fecharFormas = () => { fechar('forma'); setParcelaFormaIdx(null) }

  const abrirFormas = async index => {
    setParcelaFormaIdx(index)
    await carregarFormasPagamento()
    novaForma.setShow(false)
    abrir('forma')
  }

  const selecionarForma = f => {
    if (parcelaFormaIdx !== null) updParcela(parcelaFormaIdx, 'codFormaPagamento', String(f.codFormaPagamento))
    fecharFormas()
  }

  const novaForma = useCadastroRapido({
    empty: FORMA_PAGAMENTO_NOVA_EMPTY, api: formaPagamentosApi, idKey: 'codFormaPagamento', recarregar: loadFormas,
    validar: f => !f.formaPagamento.trim() ? 'Preencha a descrição da forma de pagamento.' : null,
    // se a API não devolver o código, procura a forma recém-criada pelo nome
    achar: (lista, f) => lista?.find(x => x.formaPagamento.toLowerCase() === f.formaPagamento.toLowerCase().trim())?.codFormaPagamento,
    sucesso: 'Forma de pagamento adicionada!', erro: 'Erro ao criar forma de pagamento.',
    aoSalvar: cod => {
      if (cod && parcelaFormaIdx !== null) updParcela(parcelaFormaIdx, 'codFormaPagamento', String(cod))
      fecharFormas()
    },
  })

  // ----- salvar / excluir / abrir
  const save = async () => {
    if (!totalOk) return toast.error(`Total dos percentuais é ${totalPercentual.toFixed(2)}%. Deve ser 100%.`)
    if (parcelasForaDeOrdem) return toast.error('Os dias das parcelas devem estar em ordem crescente.')
    try {
      const payload = {
        ...form,
        parcelas: form.parcelas.map(p => ({
          numeroParcela: parseInt(p.parcela) || 0,
          percentual: parseFloat(p.percentual) || 0,
          dias: parseInt(p.dias) || 0,
          codFormaPagamento: parseInt(p.codFormaPagamento) || 0,
        })),
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
    await carregarFormasPagamento()
    if (r) {
      const f = {
        ...r,
        parcelas: (r.parcelas ?? []).map((p, i) => ({
          parcela: p.numeroParcela ?? i + 1,
          percentual: String(p.percentual ?? 0),
          dias: p.dias ?? (i + 1) * 30,
          codFormaPagamento: String(p.codFormaPagamento ?? ''),
        })),
      }
      setForm(f); setOriginalForm(f)
      setNumParcelasInput(String(r.numeroParcelas ?? ''))
      setEditing(true)
    } else {
      setForm(empty); setOriginalForm(empty); setNumParcelasInput('1'); setEditing(false)
    }
    setOpen(true)
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  const guard = useModalGuard({
    isOpen: open,
    isDirty,
    onClose: () => setOpen(false),
    onSave: save,
    paused: isOpen('forma'),
  })

  return (
    <div>
      <PageHeader title="Condições de Pagamento" sub="Consulta de condições de pagamento" label="Nova Condição"
        onNew={() => openModal()} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => openModal(r)} onDelete={r => setConfirm(r)} />

      {open && (
        <Overlay onClose={guard.attemptClose}>
          <ModalBox maxWidth={860}>
            <ModalHeader inline
              title={editing ? 'Editar Condição de Pagamento' : 'Nova Condição de Pagamento'}
              onClose={guard.attemptClose}
              badge={
                <span style={{ fontSize: 11, fontFamily: MONO, padding: '2px 8px', borderRadius: 100, background: editing ? '#dbeafe' : '#dcfce7', color: editing ? '#1d4ed8' : '#15803d' }}>
                  {editing ? 'ALTERAR' : 'INSERIR'}
                </span>
              }
            />

            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 70px' }}>
                  <FField label="Código" value={editing ? String(form.codCondicao ?? '') : '—'} onChange={() => {}} />
                </div>
                <div style={{ flex: '1 1 280px' }}>
                  <FField label="Condição de Pagamento" required value={form.condicaoPagamento ?? ''} onChange={v => upd('condicaoPagamento', v)} />
                </div>
                <NumberField label="Nº de Parcelas" value={numParcelasInput} step="1" min="1" style={{ flex: '0 0 120px' }}
                  onChange={v => { setNumParcelasInput(String(v)); if (v !== '') gerarParcelas(v) }} />
                <div style={{ flex: '0 0 90px' }}>
                  <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                {[['Desconto %', 'percentualDesconto'], ['Multa %', 'percentualMultas'], ['Juros %', 'percentualJuros']].map(([label, key]) => (
                  <NumberField key={key} label={label} value={form[key]} onChange={v => upd(key, v)} step="0.01"
                    style={{ flex: '1 1 130px', maxWidth: 160 }} />
                ))}
              </div>

              {(form.parcelas ?? []).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={lbl}>Parcelas</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {parcelasForaDeOrdem && (
                        <span style={{ fontSize: 11, color: '#ef4444', fontFamily: MONO, fontWeight: 600 }}>⚠ Dias fora de ordem crescente</span>
                      )}
                      {!totalOk && (
                        <span style={{ fontSize: 11, color: '#ef4444', fontFamily: MONO, fontWeight: 600 }}>
                          ⚠ Total: {totalPercentual.toFixed(2)}% (deve ser 100%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                          {['Parcela', 'Percentual (%)', 'Dias', 'Forma de Pagamento'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {form.parcelas.map((p, i) => {
                          const diasInvalido = i > 0 && parseInt(p.dias) <= parseInt(form.parcelas[i - 1].dias)
                          const nomeFormaAtual = formaPagamentos.find(f => String(f.codFormaPagamento) === String(p.codFormaPagamento))?.formaPagamento || ''
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ ...tdStyle, padding: '8px 14px', color: '#94a3b8', fontFamily: MONO, fontSize: 12 }}>{p.parcela}</td>
                              <td style={{ padding: '6px 14px' }}>
                                <input type="text" inputMode="decimal" value={p.percentual}
                                  style={{ ...inp, width: 100, textAlign: 'right' }}
                                  onChange={e => updParcela(i, 'percentual', e.target.value)}
                                  onFocus={fo} onBlur={bl} />
                              </td>
                              <td style={{ padding: '6px 14px' }}>
                                <input type="number" value={p.dias}
                                  style={{ ...inp, width: 80, textAlign: 'right', borderColor: diasInvalido ? '#ef4444' : COR_BORDA }}
                                  onChange={e => updParcela(i, 'dias', e.target.value)}
                                  onFocus={fo}
                                  onBlur={e => { if (!diasInvalido) bl(e) }} />
                              </td>
                              <td style={{ padding: '6px 14px' }}>
                                <LookupField label="" value={nomeFormaAtual} onSearch={() => abrirFormas(i)} style={{ minWidth: 260 }} />
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

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e6ed', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <BtnSecondary onClick={guard.attemptClose}>Cancelar</BtnSecondary>
              <BtnPrimary onClick={save}>Salvar</BtnPrimary>
            </div>
          </ModalBox>
        </Overlay>
      )}

      <ConfirmFechar guard={guard} />

      {/* Formas de pagamento: só as ativas, com cadastro rápido */}
      <LookupModal {...modal('forma')} onClose={fecharFormas} title="Consulta de Formas de Pagamento" maxWidth={580} zIndex={70}
        cols={colsFormasPagamento} rows={formaPagamentos.filter(f => f.ativo)} onSelect={selecionarForma}
        novo={{
          cadastro: novaForma, titulo: 'Nova Forma', salvarLabel: 'Salvar Forma',
          campos: <Inp label="Forma *" value={novaForma.form.formaPagamento} onChange={v => novaForma.upd('formaPagamento', v)} style={{ flex: '1 1 200px' }} />,
        }} />

      <ConfirmDialog open={!!confirm} name={confirm?.condicaoPagamento} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}