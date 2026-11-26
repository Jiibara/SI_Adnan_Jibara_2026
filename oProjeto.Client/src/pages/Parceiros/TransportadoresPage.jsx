import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { CheckAtivo, LookupField, TipoPessoa } from '@/components/form'
import ConsultaEndereco from '@/components/lookup/ConsultaEndereco'
import ConsultaVeiculo from '@/components/lookup/ConsultaVeiculo'
import useCrud from '@/hooks/useCrud'
import useConsultaEndereco from '@/hooks/useConsultaEndereco'
import useConsultaVeiculo from '@/hooks/useConsultaVeiculo'
import { transportadoresApi } from '@/services/api'
import { regra, regraCpfCnpj, regraRgIe } from '@/constants/regrasCampos'

const VAZIO = { tipoPessoa: 'PJ', ativo: true }

const cols = [
  { key: 'codTransp', label: 'Cód.', mono: true },
  { key: 'transportador', label: 'Transportador' },
  { key: 'tipoPessoa', label: 'Tipo' },
  { key: 'cpfCnpj', label: 'CPF/CNPJ', mono: true },
  { key: 'cidade', label: 'Cidade', render: r => r.cidade?.cidade ?? '' },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

const linha = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }

export default function TransportadoresPage() {
  const { data, loading, load } = useCrud(transportadoresApi)
  const [form, setForm] = useState(VAZIO)
  const [originalForm, setOriginalForm] = useState(VAZIO)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const endereco = useConsultaEndereco({ aoSelecionarCidade: c => upd('codCidade', c.codCidade) })
  const veiculo = useConsultaVeiculo({ aoSelecionar: v => upd('codVeic', v.codVeic) })

  const abrir = (row = null) => {
    const f = row ?? VAZIO
    setForm(f)
    setOriginalForm(f)
    setEditing(!!row)
    setOpen(true)
  }

  const save = async () => {
    try {
      editing ? await transportadoresApi.update(form.codTransp, form) : await transportadoresApi.create(form)
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {
      await transportadoresApi.delete(confirm.codTransp)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro.')
    }
  }

  const pj = form.tipoPessoa !== 'PF'

  return (
    <div>
      <PageHeader title="Transportadores" sub="Consulta de Transportadores" label="Novo Transportador" onNew={() => abrir()} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrir} onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Transportador' : 'Novo Transportador'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}
        isDirty={JSON.stringify(form) !== JSON.stringify(originalForm)}
        suspended={endereco.aberto || veiculo.aberto}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <TipoPessoa value={form.tipoPessoa} onChange={v => upd('tipoPessoa', v)} />
            <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 320px' }}><FField label="Transportador" required value={form.transportador ?? ''} onChange={v => upd('transportador', v)} {...regra('transportador')} /></div>
            <div style={{ flex: '1 1 320px' }}><FField label={pj ? 'Nome Fantasia' : 'Apelido'} value={form.nomeFantasia ?? ''} onChange={v => upd('nomeFantasia', v)} {...regra('nomeFantasiaTransp')} /></div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 320px' }}><FField label={pj ? 'CNPJ' : 'CPF'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} {...regraCpfCnpj(pj)} /></div>
            <div style={{ flex: '1 1 320px' }}><FField label={pj ? 'Insc. Estadual' : 'RG'} value={form.rgInscEst ?? ''} onChange={v => upd('rgInscEst', v)} {...regraRgIe(pj, true)} /></div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 320px' }}><FField label="Endereço" value={form.endereco ?? ''} onChange={v => upd('endereco', v)} {...regra('endereco')} /></div>
            <div style={{ flex: '0 0 100px' }}><FField label="Número" type="number" value={form.numero ?? ''} onChange={v => upd('numero', Number(v))} {...regra('numeroEndereco')} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label="Complemento" value={form.complemento ?? ''} onChange={v => upd('complemento', v)} {...regra('complemento')} /></div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 220px' }}><FField label="Bairro" value={form.bairro ?? ''} onChange={v => upd('bairro', v)} {...regra('bairroTransp')} /></div>
            <div style={{ flex: '0 0 140px' }}><FField label="CEP" value={form.cep ?? ''} onChange={v => upd('cep', v)} {...regra('cep')} /></div>
            <LookupField label="Cidade" value={endereco.cidadeLabel(form.codCidade)} onSearch={endereco.abrir} style={{ flex: '1 1 220px' }} />
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 180px' }}><FField label="Telefone" value={form.fone ?? ''} onChange={v => upd('fone', v)} {...regra('fone')} /></div>
            <div style={{ flex: '1 1 250px' }}><FField label="Email" value={form.email ?? ''} onChange={v => upd('email', v)} {...regra('email')} /></div>
            <div style={{ flex: '1 1 250px' }}><FField label="Site" value={form.site ?? ''} onChange={v => upd('site', v)} {...regra('site')} /></div>
          </div>

          <LookupField label="Veículo" value={veiculo.label(form.codVeic)} onSearch={veiculo.abrir} style={{ maxWidth: 700 }} />
        </div>
      </Modal>

      <ConsultaEndereco ctrl={endereco} />
      <ConsultaVeiculo ctrl={veiculo} />

      <ConfirmDialog open={!!confirm} name={confirm?.transportador} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
