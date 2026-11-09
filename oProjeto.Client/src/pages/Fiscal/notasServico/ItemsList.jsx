import { thStyle, tdStyle, thRight, tdRight } from '@/styles/formStyles'
import { fmtMoney, fmtPercent } from '@/utils/format'

export default function ItemsList({ items, onRemove, podeRemover }) {
  return (
    <div style={{ padding: '0 24px 20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
              <th style={thStyle}>Serviço</th>
              <th style={thRight}>Duração</th>
              <th style={thRight}>Quantidade</th>
              <th style={thRight}>Vlr. Unit.</th>
              <th style={thRight}>Desconto %</th>
              <th style={thRight}>Desconto Total</th>
              <th style={thRight}>Vlr. Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Nenhum serviço adicionado.</td>
              </tr>
            )}
            {items.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                <td style={tdStyle}>{it.servicoNome || `Serviço #${it.codServico}`}</td>
                <td style={tdRight}>{it.duracaoMinutos ? `${it.duracaoMinutos} min` : '-'}</td>
                <td style={tdRight}>{it.quantidade}</td>
                <td style={tdRight} title={Number(it.descontoValor) > 0 ? `Valor unitário original: ${fmtMoney(it.valorUnitario)}` : undefined}>
                  {fmtMoney(it.valorUnitarioLiquido ?? it.valorUnitario)}
                </td>
                <td style={tdRight}>{fmtPercent(it.descontoPercentual)}%</td>
                <td style={tdRight}>{fmtMoney(it.descontoValor)}</td>
                <td style={{ ...tdRight, fontWeight: 600 }}>{fmtMoney(it.valorTotal)}</td>
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
              <td style={{ ...tdRight, fontWeight: 700 }}>{fmtMoney(items.reduce((s, it) => s + (Number(it.valorTotal) || 0), 0))}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
