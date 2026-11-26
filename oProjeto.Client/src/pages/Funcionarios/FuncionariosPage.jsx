import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { CheckAtivo, LookupField, TipoPessoa, DateField } from '@/components/form'
import ConsultaEndereco from '@/components/lookup/ConsultaEndereco'
import ConsultaFuncao from '@/components/lookup/ConsultaFuncao'
import useCrud from '@/hooks/useCrud'
import useConsultaEndereco from '@/hooks/useConsultaEndereco'
import useConsultaFuncao from '@/hooks/useConsultaFuncao'
import { funcionariosApi } from '@/services/api'
import { regra, regraCpfCnpj, regraRgIe } from '@/constants/regrasCampos'
import { toDateInput } from '@/utils/date'

// Funcionários usam 'F'/'J' no tipo de pessoa
const VAZIO = { tipoPessoa: 'F', ativo: true, salario: 0, numero: 0 }

const cols = [
  { key: 'codFunc', label: 'Cód.', mono: true },
  { key: 'funcionario', label: 'Funcionário' },
  { key: 'fone', label: 'Telefone' },
  { key: 'email', label: 'E-mail' },
  { key: 'funcao', label: 'Função', render: r => r.funcao?.funcao ?? r.funcao?.descricao ?? '' },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

const linha = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }

export default function FuncionariosPage() {
  const { data, loading, load } = useCrud(funcionariosApi)
  const [form, setForm] = useState(VAZIO)
  const [originalForm, setOriginalForm] = useState(VAZIO)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const endereco = useConsultaEndereco({
    aoSelecionarCidade: c => upd('codCidade', c.codCidade),
    aoCriarCidade: cod => upd('codCidade', cod),
  })
  const funcao = useConsultaFuncao({
    aoSelecionar: f => upd('codFuncao', f.codFuncao),
    aoCriar: cod => upd('codFuncao', cod),
  })

  const abrir = (row = null) => {
    // datas do servidor chegam com hora; o formulário trabalha com 'AAAA-MM-DD'
    const f = row
      ? { ...row, dataNascimento: toDateInput(row.dataNascimento), dataAdmissao: toDateInput(row.dataAdmissao), dataDemissao: toDateInput(row.dataDemissao) }
      : VAZIO
    setForm(f)
    setOriginalForm(f)
    setEditing(!!row)
    setOpen(true)
  }

  const save = async () => {
    const payload = {
      ...form,
      dataNascimento: form.dataNascimento || null,
      dataAdmissao: form.dataAdmissao || null,
      dataDemissao: form.dataDemissao || null,
    }
    try {
      editing ? await funcionariosApi.update(form.codFunc, payload) : await funcionariosApi.create(payload)
      toast.success('Funcionário salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar funcionário.')
    }
  }

  const del = async () => {
    try {
      await funcionariosApi.delete(confirm.codFunc)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  // campo de texto ou numérico ligado ao form, com as regras de regrasCampos.js
  const F = (label, key, type = 'text') => (
    <FField label={label} type={type} step={type === 'number' ? '0.01' : undefined}
      value={form[key] ?? ''}
      onChange={v => upd(key, type === 'number' ? (v === '' ? '' : Number(v)) : v)}
      {...regra(key === 'numero' ? 'numeroEndereco' : key)} />
  )

  const pj = form.tipoPessoa === 'J'

  return (
    <div>
      <PageHeader title="Funcionários" sub="Consulta de Funcionários" label="Novo Funcionário"
        onNew={() => abrir()} disabled={open} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrir} onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Funcionário' : 'Novo Funcionário'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}
        isDirty={JSON.stringify(form) !== JSON.stringify(originalForm)}
        suspended={endereco.aberto || funcao.aberto}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <TipoPessoa value={form.tipoPessoa} onChange={v => upd('tipoPessoa', v)} pf="F" pj="J" />
            <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
          </div>

          <div style={linha}>
            {editing && <div style={{ flex: '0 0 80px' }}><FField label="Código" disabled value={String(form.codFunc ?? '')} onChange={() => {}} /></div>}
            <div style={{ flex: '1 1 300px' }}><FField label="Funcionário" required value={form.funcionario ?? ''} onChange={v => upd('funcionario', v)} {...regra('funcionario')} /></div>
            <div style={{ flex: '1 1 180px' }}><FField label={pj ? 'Nome Fantasia' : 'Apelido'} value={form.apelido ?? ''} onChange={v => upd('apelido', v)} {...regra('apelido')} /></div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 200px' }}><FField label={pj ? 'CNPJ' : 'CPF'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} {...regraCpfCnpj(pj)} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label={pj ? 'Inscrição Estadual' : 'RG'} value={form.rgInscEst ?? ''} onChange={v => upd('rgInscEst', v)} {...regraRgIe(pj)} /></div>
            <div style={{ flex: '1 1 100px' }}>{F('Sexo (M/F)', 'sexo')}</div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 200px' }}>{F('Telefone / Celular', 'fone')}</div>
            <div style={{ flex: '2 1 300px' }}>{F('E-mail', 'email')}</div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 140px' }}>{F('CEP', 'cep')}</div>
            <div style={{ flex: '3 1 350px' }}>{F('Endereço', 'endereco')}</div>
            <div style={{ flex: '1 1 90px' }}>{F('Número', 'numero', 'number')}</div>
          </div>

          <div style={linha}>
            <div style={{ flex: '1 1 180px' }}>{F('Bairro', 'bairro')}</div>
            <div style={{ flex: '1 1 180px' }}>{F('Complemento', 'complemento')}</div>
            <LookupField label="Cidade" value={endereco.cidadeLabel(form.codCidade)} onSearch={endereco.abrir} style={{ flex: '1 1 240px' }} />
          </div>

          <div style={linha}>
            <LookupField label="Função / Cargo" value={funcao.label(form.codFuncao)} onSearch={funcao.abrir} style={{ flex: '2 1 300px' }} />
            <div style={{ flex: '1 1 180px' }}>{F('Salário Base (R$)', 'salario', 'number')}</div>
          </div>

          <div style={{ ...linha, alignItems: 'flex-start' }}>
            <DateField label="Data de Nascimento" digitavel value={form.dataNascimento} onChange={v => upd('dataNascimento', v)} style={{ flex: '1 1 180px' }} />
            <DateField label="Data de Admissão" digitavel value={form.dataAdmissao} onChange={v => upd('dataAdmissao', v)} style={{ flex: '1 1 180px' }} />
            <DateField label="Data de Demissão" digitavel value={form.dataDemissao} min={form.dataAdmissao || undefined}
              onChange={v => upd('dataDemissao', v)} style={{ flex: '1 1 180px' }} />
          </div>
        </div>
      </Modal>

      <ConsultaEndereco ctrl={endereco} />
      <ConsultaFuncao ctrl={funcao} />

      <ConfirmDialog open={!!confirm} name={confirm?.funcionario} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
