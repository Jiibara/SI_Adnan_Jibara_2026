import { FField } from '@/components/UI'
import { NumberField, CheckAtivo, LookupField } from '@/components/form'
import { regra } from '@/constants/regrasCampos'
import { lbl, inp, fo, bl, thStyle, tdStyle, COR_BORDA, MONO } from '@/styles/formStyles'

const aviso = { fontSize: 11, color: '#ef4444', fontFamily: MONO, fontWeight: 600 }

// Campos da Condição de Pagamento (use com useCondicaoForm).
//  formas           lista de formas de pagamento (para mostrar o nome na parcela)
//  onEscolherForma  (índiceDaParcela) => abre a consulta de formas
//  mostrarCodigo    exibe o campo Código (edição)
export default function CondicaoCampos({ ctrl, formas, onEscolherForma, mostrarCodigo = false }) {
  const { form, upd, updParcela, numParcelasInput, alterarNumParcelas, totalPercentual, totalOk, foraDeOrdem } = ctrl
  const nomeForma = cod => formas.find(f => String(f.codFormaPagamento) === String(cod))?.formaPagamento ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {mostrarCodigo && (
          <div style={{ flex: '0 0 70px' }}>
            <FField label="Código" value={String(form.codCondicao ?? '—')} onChange={() => {}} />
          </div>
        )}
        <div style={{ flex: '1 1 280px' }}>
          <FField label="Condição de Pagamento" required value={form.condicaoPagamento ?? ''}
            onChange={v => upd('condicaoPagamento', v)} {...regra('condicaoPagamento')} />
        </div>
        <NumberField label="Nº de Parcelas" value={numParcelasInput} step="1" min="1" style={{ flex: '0 0 120px' }}
          onChange={alterarNumParcelas} />
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={lbl}>Parcelas</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {foraDeOrdem && <span style={aviso}>⚠ Dias fora de ordem crescente</span>}
              {!totalOk && <span style={aviso}>⚠ Total: {totalPercentual.toFixed(2)}% (deve ser 100%)</span>}
            </div>
          </div>

          <div style={{ border: `1px solid ${COR_BORDA}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COR_BORDA}`, background: '#f8f9fb' }}>
                  {['Parcela', 'Percentual (%)', 'Dias', 'Forma de Pagamento'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {form.parcelas.map((p, i) => {
                  const diasInvalido = i > 0 && parseInt(p.dias) <= parseInt(form.parcelas[i - 1].dias)
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
                        <LookupField label="" value={nomeForma(p.codFormaPagamento)} onSearch={() => onEscolherForma(i)} style={{ minWidth: 260 }} />
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
  )
}
