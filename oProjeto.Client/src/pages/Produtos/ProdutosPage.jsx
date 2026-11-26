import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { CheckAtivo, LookupField } from '@/components/form'
import ConsultaCategoria from '@/components/lookup/ConsultaCategoria'
import ConsultaMarca from '@/components/lookup/ConsultaMarca'
import useCrud from '@/hooks/useCrud'
import useConsultaCategoria from '@/hooks/useConsultaCategoria'
import useConsultaMarca from '@/hooks/useConsultaMarca'
import { produtosApi } from '@/services/api'
import { regra } from '@/constants/regrasCampos'
import { fmtMoney } from '@/utils/format'

const VAZIO = { ativo: true, saldo: 0, quantidadeMinima: 1, pesoBruto: 0, pesoLiq: 0, precoCompra: 0, precoVenda: 0, custoMedio: 0 }

const cols = [
  { key: 'codProd', label: 'Cód.', mono: true },
  { key: 'produto', label: 'Produto' },
  { key: 'unidade', label: 'Un.', mono: true },
  { key: 'categoria', label: 'Categoria', render: r => r.categoria?.categoria ?? '' },
  { key: 'marca', label: 'Marca', render: r => r.marca?.marca ?? '' },
  { key: 'saldo', label: 'Saldo', align: 'right', mono: true },
  { key: 'precoVenda', label: 'Preço Venda', align: 'right', mono: true, render: r => fmtMoney(r.precoVenda) },
  { key: 'custoMedio', label: 'Custo Médio', align: 'right', mono: true, render: r => fmtMoney(r.custoMedio) },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

const linha = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }

export default function ProdutosPage() {
  const { data, loading, load } = useCrud(produtosApi)
  const [form, setForm] = useState(VAZIO)
  const [originalForm, setOriginalForm] = useState(VAZIO)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const categoria = useConsultaCategoria({
    aoSelecionar: c => upd('codCategoria', c.codCategoria),
    aoCriar: cod => upd('codCategoria', cod),
  })
  const marca = useConsultaMarca({
    aoSelecionar: m => upd('codMarca', m.codMarca),
    aoCriar: cod => upd('codMarca', cod),
  })

  const abrir = (row = null) => {
    const f = row ?? VAZIO
    setForm(f)
    setOriginalForm(f)
    setEditing(!!row)
    setOpen(true)
  }

  const save = async () => {
    try {
      editing ? await produtosApi.update(form.codProd, form) : await produtosApi.create(form)
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {
      await produtosApi.delete(confirm.codProd)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  // campo de texto ou numérico ligado ao form, com as regras de regrasCampos.js
  const F = (label, key, num = false) => (
    <FField label={label} type={num ? 'number' : 'text'} step={num ? '0.01' : undefined}
      value={form[key] ?? ''} onChange={v => upd(key, num ? Number(v) : v)} {...regra(key)} />
  )

  return (
    <div>
      <PageHeader title="Produtos" sub="Consulta de Produtos" label="Novo Produto" onNew={() => abrir()} disabled={open} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrir} onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Produto' : 'Novo Produto'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}
        isDirty={JSON.stringify(form) !== JSON.stringify(originalForm)}
        suspended={categoria.aberto || marca.aberto}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={linha}>
            {editing && (
              <div style={{ flex: '0 0 80px' }}><FField label="Código" disabled value={String(form.codProd ?? '')} onChange={() => {}} /></div>
            )}
            <div style={{ flex: '1 1 200px' }}>{F('Produto', 'produto')}</div>
            <div style={{ flex: '0 0 100px' }}>{F('Unidade', 'unidade')}</div>
            <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
          </div>

          <div style={linha}>
            <LookupField label="Categoria" value={categoria.label(form.codCategoria)} onSearch={categoria.abrir} style={{ flex: '1 1 200px' }} />
            <LookupField label="Marca" value={marca.label(form.codMarca)} onSearch={marca.abrir} style={{ flex: '1 1 200px' }} />
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 140px' }}>{F('Preço Compra (R$)', 'precoCompra', true)}</div>
            <div style={{ flex: '1 1 140px' }}>{F('Preço Venda (R$)', 'precoVenda', true)}</div>
            <div style={{ flex: '1 1 140px' }}>{F('Custo Médio (R$)', 'custoMedio', true)}</div>
            <div style={{ flex: '1 1 140px' }}>{F('Saldo', 'saldo', true)}</div>
          </div>

          <div style={linha}>
            <div style={{ flex: '0 0 140px' }}>{F('Quantidade Mínima', 'quantidadeMinima', true)}</div>
            <div style={{ flex: '0 0 150px' }}>{F('Peso Bruto (kg)', 'pesoBruto', true)}</div>
            <div style={{ flex: '0 0 150px' }}>{F('Peso Líquido (kg)', 'pesoLiq', true)}</div>
          </div>
        </div>
      </Modal>

      <ConsultaCategoria ctrl={categoria} />
      <ConsultaMarca ctrl={marca} />

      <ConfirmDialog open={!!confirm} name={confirm?.produto} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
