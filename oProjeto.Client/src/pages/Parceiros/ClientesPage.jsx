import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { CheckAtivo, LookupField, TipoPessoa, DateField } from '@/components/form'
import ConsultaEndereco from '@/components/lookup/ConsultaEndereco'
import ConsultaCondicao from '@/components/condicao/ConsultaCondicao'
import useCrud from '@/hooks/useCrud'
import useConsultaEndereco from '@/hooks/useConsultaEndereco'
import useConsultaCondicao from '@/hooks/useConsultaCondicao'
import { clientesApi } from '@/services/api'
import { regra, regraCpfCnpj, regraRgIe } from '@/constants/regrasCampos'
import { toDateInput } from '@/utils/date'

// Clientes usa 'F' / 'J' no tipo de pessoa
const VAZIO = { tipoPessoa: 'F', ativo: true, limiteCredito: 0, numero: 0 }

const cols = [
  { key: 'codCliente', label: 'Cód.', mono: true },
  { key: 'cliente', label: 'Cliente' },
  { key: 'cpfCnpj', label: 'CPF / CNPJ' },
  { key: 'fone', label: 'Telefone' },
  { key: 'condicao', label: 'Cond. Pagamento', render: r => r.condicao?.condicaoPagamento ?? '' },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

const linha = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }

export default function ClientesPage() {
  const { data, loading, load } = useCrud(clientesApi)
  const [form, setForm] = useState({})
  const [originalForm, setOriginalForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const endereco = useConsultaEndereco({ aoSelecionarCidade: c => setForm(f => ({ ...f, codCidade: c.codCidade, cidade: c })) })
  const condicao = useConsultaCondicao({
    aoSelecionar: cod => upd('codCondicao', cod),
    aoCriar: cod => upd('codCondicao', cod),
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
      const payload = { ...form, dataNascimento: toDateInput(form.dataNascimento) || null }
      editing ? await clientesApi.update(payload.codCliente, payload) : await clientesApi.create(payload)
      toast.success('Cliente salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar cliente.')
    }
  }

  const del = async () => {
    try {
      await clientesApi.delete(confirm.codCliente)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  const pj = form.tipoPessoa === 'J'

  return (
    <div>
      <PageHeader title="Clientes" sub="Consulta de Clientes" label="Novo Cliente" onNew={() => abrir()} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrir} onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Cliente' : 'Novo Cliente'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}
        isDirty={JSON.stringify(form) !== JSON.stringify(originalForm)}
        suspended={condicao.aberto || endereco.aberto}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <TipoPessoa value={form.tipoPessoa} onChange={v => upd('tipoPessoa', v)} pf="F" pj="J" />
            <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
          </div>

          <div style={linha}>
            {editing && <div style={{ flex: '0 0 80px' }}><FField label="Código" disabled value={String(form.codCliente ?? '')} onChange={() => {}} /></div>}
            <div style={{ flex: '1 1 300px' }}><FField label="Cliente" required value={form.cliente ?? ''} onChange={v => upd('cliente', v)} {...regra('cliente')} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label={pj ? 'Nome Fantasia' : 'Apelido'} value={form.apelido ?? ''} onChange={v => upd('apelido', v)} {...regra('apelido')} /></div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 200px' }}><FField label={pj ? 'CNPJ' : 'CPF'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} {...regraCpfCnpj(pj)} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label={pj ? 'Inscrição Estadual' : 'RG'} value={form.rgInscEst ?? ''} onChange={v => upd('rgInscEst', v)} {...regraRgIe(pj)} /></div>
            <div style={{ flex: '1 1 100px' }}><FField label="Sexo (M/F)" value={form.sexo ?? ''} onChange={v => upd('sexo', v)} {...regra('sexo')} /></div>
            <DateField label="Data de Nascimento" digitavel value={toDateInput(form.dataNascimento)} onChange={v => upd('dataNascimento', v)} style={{ flex: '1 1 160px' }} />
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 200px' }}><FField label="Telefone" value={form.fone ?? ''} onChange={v => upd('fone', v)} {...regra('fone')} /></div>
            <div style={{ flex: '2 1 300px' }}><FField label="E-mail" value={form.email ?? ''} onChange={v => upd('email', v)} {...regra('email')} /></div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 130px' }}><FField label="CEP" value={form.cep ?? ''} onChange={v => upd('cep', v)} {...regra('cep')} /></div>
            <div style={{ flex: '3 1 350px' }}><FField label="Endereço" value={form.endereco ?? ''} onChange={v => upd('endereco', v)} {...regra('endereco')} /></div>
            <div style={{ flex: '1 1 90px' }}><FField label="Número" type="number" value={form.numero ?? ''} onChange={v => upd('numero', v === '' ? '' : Number(v))} {...regra('numeroEndereco')} /></div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 200px' }}><FField label="Bairro" value={form.bairro ?? ''} onChange={v => upd('bairro', v)} {...regra('bairro')} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label="Complemento" value={form.complemento ?? ''} onChange={v => upd('complemento', v)} {...regra('complemento')} /></div>
            <LookupField label="Cidade *" value={form.cidade?.cidade ?? endereco.cidadeLabel(form.codCidade)} onSearch={endereco.abrir} style={{ flex: '1 1 250px' }} />
          </div>

          <div style={linha}>
            <LookupField label="Condição de Pagamento *" value={condicao.label(form.codCondicao)} onSearch={condicao.abrir} style={{ flex: '2 1 300px' }} />
            <div style={{ flex: '1 1 180px' }}><FField label="Limite de Crédito (R$)" type="number" value={form.limiteCredito ?? ''} onChange={v => upd('limiteCredito', v === '' ? '' : Number(v))} /></div>
          </div>
        </div>
      </Modal>

      <ConsultaCondicao ctrl={condicao} />
      <ConsultaEndereco ctrl={endereco} />

      <ConfirmDialog open={!!confirm} name={confirm?.cliente} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
