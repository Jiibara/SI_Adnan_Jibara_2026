import { inp, fo, bl, thStyle, thRight, tdStyle, tdRight } from '@/styles/formStyles'
import { fmtMoney } from '@/utils/format'
import { getDescontoItem } from './calculos'

export default function ItemsList({ items, onRemove, onChangeQuantidade, disabledQuantidade, disabledRemover }) {
  return (
    <div style={{ padding: '0 0px 20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
              <th style={thStyle}>Produto</th>
              <th style={thStyle}>Unid.</th>
              <th style={thRight}>Comprada</th>
              <th style={thRight}>Já Recebida</th>
              <th style={thRight}>Recebida</th>
              <th style={thRight}>Falta</th>
              <th style={thRight}>Vlr. Unit.</th>
              <th style={thRight}>Vlr. Total</th>
              <th style={thRight}>Desconto Total</th>
              <th style={thRight}>Rateio</th>
              <th style={thRight}>Custo Final (unit.)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={12} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Nenhum item adicionado.</td></tr>
            )}
            {items.map((it, i) => {
              const rateioTotal = (Number(it.rateioFrete) || 0) + (Number(it.rateioSeguro) || 0) + (Number(it.rateioOutras) || 0)
              const rateioTitle = `Frete: ${fmtMoney(it.rateioFrete)} · Seguro: ${fmtMoney(it.rateioSeguro)} · Outras: ${fmtMoney(it.rateioOutras)}`
              const descontoItem = getDescontoItem(it)
              const descontoExcede = descontoItem > 0 && descontoItem >= (Number(it.valorTotal) || 0) + descontoItem
              // Só item vindo de pedido de compra recebe quantidade na grid.
              // Item avulso já tem a quantidade definida em "Adicionar Item".
              const vindoDePedido = it.quantidadePendente != null
              const falta = it.quantidadePendente != null
                ? Math.max((Number(it.quantidadePendente) || 0) - (Number(it.quantidade) || 0), 0)
                : null
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                  <td style={tdStyle}>{it.produtoNome || `Produto #${it.codProd}`}</td>
                  <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.unidade || '-'}</td>
                  <td style={tdRight}>{it.quantidadeComprada ?? '-'}</td>
                  <td style={tdRight}>{it.quantidadeRecebidaAnterior ?? 0}</td>
                  {vindoDePedido ? (
                    <td style={{ ...tdRight, padding: '6px 14px' }}>
                      <input type="number" step="0.001" min="0" max={it.quantidadePendente}
                        value={it.quantidade ?? ''} disabled={disabledQuantidade} onChange={e => onChangeQuantidade(i, e.target.value)}
                        style={{ ...inp, width: 105, padding: '6px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', background: disabledQuantidade ? '#f1f4f8' : inp.background, color: disabledQuantidade ? '#94a3b8' : inp.color }}
                        onFocus={e => { fo(e); e.target.select() }} onBlur={bl} />
                    </td>
                  ) : (
                    <td style={tdRight} title="Item avulso: para mudar a quantidade, remova o item e adicione novamente.">
                      {it.quantidade}
                    </td>
                  )}
                  <td style={{ ...tdRight, fontWeight: 600 }}>
                    {falta != null ? falta : '-'}
                  </td>
                  <td style={tdRight} title={descontoItem > 0 ? `Valor unitário original: ${fmtMoney(it.valorUnitario)}` : undefined}>{fmtMoney(it.valorUnitarioLiquido)}</td>
                  <td style={tdRight}>{fmtMoney(it.valorTotal)}</td>
                  <td style={{ ...tdRight, color: descontoExcede ? '#b45309' : '#0f172a', fontWeight: descontoExcede ? 700 : 400 }}
                    title={descontoExcede ? 'Desconto ≥ valor do item' : undefined}>
                    {fmtMoney(descontoItem)}
                  </td>
                  <td style={{ ...tdRight, cursor: 'help' }} title={rateioTitle}>{fmtMoney(rateioTotal)}</td>
                  <td style={{ ...tdRight, fontWeight: 600 }}>{fmtMoney(it.custoFinal)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                    <button onClick={() => onRemove(i)} disabled={disabledRemover}
                      style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: disabledRemover ? '#f1f4f8' : '#fee2e2', color: disabledRemover ? '#94a3b8' : '#dc2626', cursor: disabledRemover ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Remover
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #e2e6ed', background: '#f8f9fb' }}>
              <td colSpan={7} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right' }}>VALOR TOTAL DOS PRODUTOS</td>
              <td style={{ ...tdRight, fontWeight: 700 }}>{fmtMoney(items.reduce((s, it) => s + (Number(it.valorTotal) || 0), 0))}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}