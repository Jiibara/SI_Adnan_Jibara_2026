import { SelectField, DateField, BtnSecondary } from '@/components/form'
import { SITUACOES } from '@/utils/contas'
import { MONO } from '@/styles/formStyles'

// Barra de filtros das telas de contas. Use com useFiltrosContas.
//  parceiroLabel  'Fornecedor' | 'Cliente'
//  situacoes      chaves de SITUACOES mostradas no filtro
//  tipos          opções extras de tipo (ex.: Produto/Serviço); sem elas o filtro não aparece
export default function FiltrosContas({ ctrl, parceiroLabel, situacoes, tipos }) {
  const { filtros, upd, limpar, ativos, parceiros, filtradas, total } = ctrl
  const plural = parceiroLabel === 'Cliente' ? 'Todos os clientes' : 'Todos os fornecedores'

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, padding: '14px 16px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <SelectField label={parceiroLabel} value={filtros.parceiro} onChange={v => upd('parceiro', v)}
          options={[{ value: '', label: plural }, ...parceiros]} style={{ flex: '1 1 220px', minWidth: 200 }} />

        <SelectField label="Situação" value={filtros.situacao} onChange={v => upd('situacao', v)}
          options={[{ value: '', label: 'Todas' }, ...situacoes.map(s => ({ value: s, label: SITUACOES[s].filtro }))]}
          style={{ flex: '1 1 170px', minWidth: 160 }} />

        {tipos && (
          <SelectField label="Tipo" value={filtros.tipo} onChange={v => upd('tipo', v)}
            options={[{ value: '', label: 'Todos' }, ...tipos]} style={{ flex: '1 1 150px', minWidth: 140 }} />
        )}

        <DateField label="Vencimento inicial" digitavel value={filtros.vencInicial} onChange={v => upd('vencInicial', v)}
          max={filtros.vencFinal || undefined} style={{ flex: '0 1 170px', minWidth: 150 }} />
        <DateField label="Vencimento final" digitavel value={filtros.vencFinal} onChange={v => upd('vencFinal', v)}
          min={filtros.vencInicial || undefined} style={{ flex: '0 1 170px', minWidth: 150 }} />

        {ativos && <BtnSecondary onClick={limpar}>Limpar filtros</BtnSecondary>}
      </div>

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#64748b', fontSize: 11 }}>
          Filtre por {parceiroLabel.toLowerCase()}, situação{tipos ? ', tipo' : ''} ou período de vencimento.
        </span>
        <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: MONO }}>{filtradas.length} de {total} registro(s)</span>
      </div>
    </div>
  )
}
