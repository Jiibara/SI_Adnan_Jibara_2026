import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/UI'
import { DateField, SelectField, ReadOnlyField } from '@/components/form'
import { calcularBaixa } from '@/utils/contas'
import { fmtMoney } from '@/utils/format'
import { hojeISO, toDateInput } from '@/utils/date'
import { lbl, MONO } from '@/styles/formStyles'

const ValorCard = ({ label, valor, cor, detalhe }) => (
  <div style={{ padding: '12px 13px', border: '1px solid #e2e6ed', borderRadius: 8, background: '#f8f9fb' }}>
    <div style={lbl}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: cor, fontFamily: MONO }}>{fmtMoney(valor)}</div>
    <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8' }}>{detalhe}</div>
  </div>
)

const Aviso = ({ titulo, texto, ok }) => (
  <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 8, border: `1px solid ${ok ? '#bbf7d0' : '#fed7aa'}`, background: ok ? '#f0fdf4' : '#fff7ed' }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: ok ? '#047857' : '#c2410c' }}>{titulo}</div>
    <div style={{ marginTop: 5, fontSize: 11, color: ok ? '#166534' : '#9a3412' }}>{texto}</div>
  </div>
)

// Modal "Registrar Pagamento" / "Registrar Recebimento" de uma parcela.
// Renderize com key da parcela, para o formulário reiniciar a cada conta.
//  conta             parcela selecionada
//  detalhes          [[rótulo, valor], ...] mostrados no topo
//  formas            formas de pagamento
//  receber           true: textos de recebimento
//  dataEditavel      permite escolher a data (senão é sempre hoje)
//  formaObrigatoria  exige forma de pagamento
//  onConfirm({ dataBaixa, codFormaPagamento, calc })  faz a baixa; lance erro para manter o modal aberto
export default function BaixaModal({ conta, detalhes, formas, receber = false, dataEditavel = false, formaObrigatoria = false, onClose, onConfirm }) {
  const inicial = { dataBaixa: hojeISO(), codFormaPagamento: conta.codFormaPagamento ? String(conta.codFormaPagamento) : '' }
  const [form, setForm] = useState(inicial)
  const [saving, setSaving] = useState(false)
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const calc = useMemo(() => calcularBaixa(conta, form.dataBaixa), [conta, form.dataBaixa])
  const acao = receber ? 'Recebimento' : 'Pagamento'
  const emissao = toDateInput(conta.dataEmissao)

  const confirmar = async () => {
    if (saving) return
    if (!form.dataBaixa) return toast.error(`Informe a data do ${acao.toLowerCase()}.`)
    if (dataEditavel && form.dataBaixa > hojeISO()) return toast.error(`A data do ${acao.toLowerCase()} não pode ser futura.`)
    if (dataEditavel && emissao && form.dataBaixa < emissao) return toast.error(`A data do ${acao.toLowerCase()} não pode ser anterior à emissão.`)
    if (formaObrigatoria && !form.codFormaPagamento) return toast.error('Selecione a forma de pagamento.')
    if (calc.valorFinal <= 0) return toast.error(`O valor final do ${acao.toLowerCase()} deve ser maior que zero.`)

    setSaving(true)
    try {
      await onConfirm({ dataBaixa: form.dataBaixa, codFormaPagamento: form.codFormaPagamento ? Number(form.codFormaPagamento) : null, calc })
    } catch {
      // a página já mostrou o erro
    } finally {
      setSaving(false)
    }
  }

  const formaOptions = [
    { value: '', label: 'Selecione...' },
    ...formas.map(f => ({ value: String(f.codFormaPagamento), label: f.formaPagamento })),
  ]

  return (
    <Modal open title={`Registrar ${acao}`} badgeLabel={receber ? 'RECEBER' : 'PAGAR'} maxWidth={620}
      saveLabel={saving ? 'Registrando...' : `Confirmar ${acao.toLowerCase()}`}
      onClose={() => !saving && onClose()} onSave={confirmar}
      isDirty={JSON.stringify(form) !== JSON.stringify(inicial)}>

      <div style={{ background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 9, padding: 14, marginBottom: 18, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        {detalhes.map(([rotulo, valor]) => (
          <div key={rotulo}>
            <div style={lbl}>{rotulo}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{valor}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <ReadOnlyField label="Valor Original" value={fmtMoney(calc.original)} style={{ flex: '1 1 180px' }} />
        <DateField label={`Data ${acao}`} digitavel value={form.dataBaixa} onChange={v => upd('dataBaixa', v)}
          disabled={!dataEditavel} min={dataEditavel ? emissao || undefined : undefined} max={dataEditavel ? hojeISO() : undefined}
          style={{ flex: '1 1 180px' }} />
      </div>

      <SelectField label={`Forma de Pagamento${formaObrigatoria ? ' *' : ''}`} value={form.codFormaPagamento}
        onChange={v => upd('codFormaPagamento', v)} options={formaOptions} style={{ marginTop: 14 }} />

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <ValorCard label="Desconto" valor={calc.desconto} cor="#047857" detalhe={`${calc.pDesc.toFixed(2)}%`} />
        <ValorCard label="Juros" valor={calc.juros} cor="#c2410c" detalhe={`${calc.pJuros.toFixed(2)}% ao mês`} />
        <ValorCard label="Multa" valor={calc.multa} cor="#b91c1c" detalhe={`${calc.pMulta.toFixed(2)}%`} />
      </div>

      {calc.atrasado ? (
        <Aviso titulo={`${acao} em atraso`}
          texto={`${acao} ${calc.diasAtraso} dia(s) após o vencimento. A multa é aplicada uma vez e os juros são proporcionais aos dias de atraso.`} />
      ) : (
        <Aviso ok titulo={`${acao} dentro do prazo`}
          texto={calc.diasAntecipacao > 0
            ? `${acao} ${calc.diasAntecipacao} dia(s) antes do vencimento. O desconto da condição foi aplicado automaticamente.`
            : `${acao} no dia do vencimento. O desconto da condição foi aplicado automaticamente.`} />
      )}

      <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 9, background: '#eff6ff', border: '1px solid #dbeafe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{receber ? 'Valor a Receber' : 'Valor a Pagar'}</span>
          <strong style={{ fontSize: 18, color: '#0f172a', fontFamily: MONO }}>{fmtMoney(calc.valorFinal)}</strong>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
          {calc.atrasado ? 'Original + juros + multa.' : 'Original − desconto.'}
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: '#64748b' }}>
        Regras da condição: desconto {calc.pDesc.toFixed(2)}% · juros {calc.pJuros.toFixed(2)}% ao mês · multa {calc.pMulta.toFixed(2)}%.
      </div>
    </Modal>
  )
}
