import { lbl, inp, fo, bl, thStyle, tdStyle, thRight, tdRight, MONO, DESABILITADO } from '@/styles/formStyles'
import { LookupField, BtnPrimary, DateField } from '@/components/form'
import { fmtPercent, fmtMoney, arredondar2 } from '@/utils/format'
import { toDateInput } from '@/utils/date'

// Grade de parcelas da nota (entrada e saída).
//  onSearchCondicao  abre a consulta de condições de pagamento
//  onGerar           gera as parcelas   | podeGerar  habilita o botão
//  condicaoDisabled  trava a escolha da condição
//  bloqueado         trava a edição das parcelas (ex.: cancelamento)
//  dataDigitavel     permite digitar o vencimento (além do calendário)
export default function ParcelasGrid({
  parcelas, valorTotalNota, onChangeParcela, condicaoLabel,
  onSearchCondicao, onGerar, podeGerar = true, condicaoDisabled = false,
  bloqueado = false, dataDigitavel = false,
}) {
  return (
    <div style={{ padding: '4px 24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 16 }}>
        <label style={{ ...lbl, marginBottom: 0 }}>Parcelas {condicaoLabel ? `— ${condicaoLabel}` : ''}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 300 }}>
            <LookupField label="" value={condicaoLabel} onSearch={onSearchCondicao} disabled={condicaoDisabled} />
          </div>
          <BtnPrimary onClick={onGerar} disabled={!podeGerar} style={{ whiteSpace: 'nowrap' }}>Gerar Parcelas</BtnPrimary>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
              <th style={thStyle}>Parcela</th>
              <th style={thStyle}>Vencimento</th>
              <th style={thRight}>Percentual</th>
              <th style={thRight}>Valor</th>
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
              const total = Number(valorTotalNota) || 0
              const valorParcela = Number(p.valor) || 0
              const derivado = total > 0 ? valorParcela / total * 100 : 0
              // Parcela que só difere por ajuste de centavos mantém o percentual da condição (ex.: 25%);
              // se o usuário editar o valor, passa a mostrar o percentual real.
              const esperado = arredondar2(total * (Number(p.percentual) || 0) / 100)
              const usaConfigurado = p.percentual != null && Math.abs(valorParcela - esperado) <= 0.011
              const percentual = usaConfigurado ? Number(p.percentual) : derivado
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                  <td style={{ ...tdStyle, fontFamily: MONO }}>{p.numeroParcela}</td>
                  <td style={{ ...tdStyle, padding: '6px 14px' }}>
                    <DateField label="Vencimento" hideLabel digitavel={dataDigitavel} disabled={bloqueado}
                      value={toDateInput(p.vencimento)}
                      onChange={v => onChangeParcela(i, 'vencimento', v)}
                      inputStyle={{ padding: '6px 38px 6px 8px', fontSize: 13 }}
                      style={{ minWidth: 150 }} />
                  </td>
                  <td style={tdRight}>{fmtPercent(percentual)}%</td>
                  <td style={{ ...tdStyle, padding: '6px 14px' }}>
                    <input
                      type="number" step="0.01" min="0" value={p.valor ?? ''} disabled={bloqueado}
                      onChange={e => onChangeParcela(i, 'valor', e.target.value === '' ? '' : e.target.value)}
                      onFocus={e => { fo(e); e.target.select() }}
                      onBlur={e => {
                        bl(e)
                        if (p.valor !== '' && p.valor !== undefined && p.valor !== null) {
                          const parsed = parseFloat(p.valor)
                          if (!isNaN(parsed)) onChangeParcela(i, 'valor', Number(parsed.toFixed(2)))
                        }
                      }}
                      style={{ ...inp, padding: '6px 8px', fontSize: 13, fontFamily: MONO, textAlign: 'right', ...(bloqueado ? DESABILITADO : null) }}
                    />
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
}
