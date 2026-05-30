import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { condicoesApi } from '@/services/api'
import useCrud from '@/hooks/useCrud'

const empty = {
  condicaoPagamento: '',
  numeroParcelas: 1,
  percentualJuros: 0,
  percentualMulta: 0,
  percentualDesconto: 0,
  ativo: true,
  parcelas: []
}

export default function CondicaoPagamentoPage() {
  const { data, loading, load } = useCrud(condicoesApi)

  const [form, setForm] = useState(empty)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const gerarParcelas = () => {
    if (!form.condicaoPagamento) return

    const dias = form.condicaoPagamento
      .split('/')
      .map(d => Number(d.trim()))
      .filter(n => !isNaN(n))

    if (!dias.length) return

    const percentualBase = 100 / dias.length

    const parcelas = dias.map((d, i) => ({
      numeroParcela: i + 1,
      dias: d,
      percentual: i === dias.length - 1
        ? 100 - (percentualBase * (dias.length - 1))
        : Number(percentualBase.toFixed(2)),
      codFormaPagamento: 1
    }))

    setForm(p => ({
      ...p,
      numeroParcelas: dias.length,
      parcelas
    }))
  }

  const save = async () => {
    try {
      if (editing)
        await condicoesApi.update(form.codCondicao, form)
      else
        await condicoesApi.create(form)

      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {
      await condicoesApi.delete(confirm.codCondicao)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro.')
    }
  }

  const cols = [
    { key: 'codCondicao', label: 'Cód.', mono: true },
    { key: 'condicaoPagamento', label: 'Condição' },
    { key: 'numeroParcelas', label: 'Parcelas' },
  ]

  return (
    <div>
      <PageHeader
        title="Condições de Pagamento"
        sub="Consulta de Condições de Pagamento"
        label="Nova Condição"
        onNew={() => {
          setForm(empty)
          setEditing(false)
          setOpen(true)
        }}
      />

      <DataTable
        columns={cols}
        data={data}
        loading={loading}
        onEdit={r => {
          setForm(r)
          setEditing(true)
          setOpen(true)
        }}
        onDelete={r => setConfirm(r)}
      />

      <Modal
        open={open}
        title="Condição de Pagamento"
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={save}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <FField
            label="Condição (30/60/90)"
            required
            value={form.condicaoPagamento ?? ''}
            onChange={v => upd('condicaoPagamento', v)}
          />

          <button onClick={gerarParcelas}>
            Gerar Parcelas
          </button>

          {form.parcelas?.length > 0 && (
            <table style={{ width: '100%', marginTop: 10 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Dias</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {form.parcelas.map(p => (
                  <tr key={p.numeroParcela}>
                    <td>{p.numeroParcela}</td>
                    <td>{p.dias}</td>
                    <td>{p.percentual.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        name={confirm?.condicaoPagamento}
        onClose={() => setConfirm(null)}
        onConfirm={del}
      />
    </div>
  )
}