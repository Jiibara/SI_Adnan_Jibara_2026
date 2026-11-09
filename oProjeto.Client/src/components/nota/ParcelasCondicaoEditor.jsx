import { lbl } from '@/styles/formStyles'
import { BtnPrimary, BtnSecondary, NumberField, ReadOnlyField, SelectField } from '@/components/form'
import { fmtPercent } from '@/utils/format'

// Editor das parcelas de uma Condição de Pagamento nova (percentual, dias e forma de pagamento).
export default function ParcelasCondicaoEditor({ parcelas, onChange, formaPagamentos }) {
  const total = parcelas.reduce((s, p) => s + (Number(p.percentual) || 0), 0)

  const addLinha = () => onChange([...parcelas, {
    numeroParcela: parcelas.length + 1,
    percentual: 0,
    dias: 30,
    codFormaPagamento: formaPagamentos[0]?.codFormaPagamento ?? null,
  }])
  const updLinha = (i, campo, valor) => onChange(parcelas.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p))
  const removeLinha = i => onChange(parcelas.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, numeroParcela: idx + 1 })))

  return (
    <div style={{ flex: '1 1 100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ ...lbl, marginBottom: 0 }}>
          Parcelas {parcelas.length > 0 && `(soma: ${fmtPercent(total)}%)`}
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
              <NumberField label="Percentual (%)" value={p.percentual} onChange={v => updLinha(i, 'percentual', v)} step="0.01" min="0" style={{ flex: '0 0 130px' }} />
              <NumberField label="Dias" value={p.dias} onChange={v => updLinha(i, 'dias', v)} step="1" min="0" style={{ flex: '0 0 90px' }} />
              <SelectField label="Forma de Pagamento" value={p.codFormaPagamento} onChange={v => updLinha(i, 'codFormaPagamento', Number(v))}
                options={formaPagamentos.map(f => ({ value: f.codFormaPagamento, label: f.formaPagamento }))} style={{ flex: '1 1 180px' }} />
              <BtnSecondary onClick={() => removeLinha(i)}>Remover</BtnSecondary>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
