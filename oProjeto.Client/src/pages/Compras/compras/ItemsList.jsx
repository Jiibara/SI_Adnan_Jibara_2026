import { thStyle, tdStyle, thRight, tdRight } from '@/styles/formStyles'
import { fmtMoney } from '@/utils/format'
import { getDescontoItem } from '@/utils/notaCalculos'

export default function ItemsList({ items, onRemove, disabled }) {
  return (
    <div style={{ padding: '0 24px 20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
              <th style={thStyle}>Produto</th>
              <th style={thStyle}>Unid.</th>
              <th style={thRight}>Qtd.</th>
              <th style={thRight}>Vlr. Unit.</th>
              <th style={thRight}>Vlr. Bruto</th>
              <th style={thRight}>Desconto Total</th>
              <th style={thRight}>Vlr. Líquido</th>
              <th style={thRight}>Rateio</th>
              <th style={thRight}>Custo Final (unit.)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Nenhum item adicionado.</td></tr>
            )}
            {items.map((it, i) => {
              const bruto = (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0)
              const desconto = getDescontoItem(it)
              const rateioTotal = (Number(it.rateioFrete) || 0) + (Number(it.rateioSeguro) || 0) + (Number(it.rateioOutras) || 0)
              const rateioTitle = `Frete: ${fmtMoney(it.rateioFrete)} · Seguro: ${fmtMoney(it.rateioSeguro)} · Outras: ${fmtMoney(it.rateioOutras)}`
              const descontoExcede = bruto > 0 && desconto >= bruto
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                  <td style={tdStyle}>{it.produtoNome || `Produto #${it.codProd}`}</td>
                  <td style={tdStyle}>{it.unidade || '-'}</td>
                  <td style={tdRight}>{it.quantidade}</td>
                  <td style={tdRight}>{fmtMoney(it.valorUnitario)}</td>
                  <td style={tdRight}>{fmtMoney(bruto)}</td>
                  <td style={{ ...tdRight, color: descontoExcede ? '#b45309' : '#0f172a', fontWeight: descontoExcede ? 700 : 400 }}
                    title={descontoExcede ? 'Desconto ≥ valor do item' : undefined}>
                    {fmtMoney(desconto)}
                  </td>
                  <td style={tdRight}>{fmtMoney(it.valorTotal)}</td>
                  <td style={{ ...tdRight, cursor: 'help' }} title={rateioTitle}>{fmtMoney(rateioTotal)}</td>
                  <td style={{ ...tdRight, fontWeight: 600 }}>{fmtMoney(it.custoFinal)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                    <button disabled={disabled} onClick={() => onRemove(i)}
                      style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: disabled ? '#f1f4f8' : '#fee2e2', color: disabled ? '#94a3b8' : '#dc2626', cursor: disabled ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Remover
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
