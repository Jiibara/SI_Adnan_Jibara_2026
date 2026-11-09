import { useState } from 'react'
import toast from 'react-hot-toast'

// Cadastro rápido dentro de um modal de consulta (ex.: "Novo Fornecedor").
//  empty       valor inicial do formulário
//  api         objeto com create()
//  idKey       nome do campo com o código gerado (ex.: 'codForn')
//  validar     (form) => mensagem de erro | null
//  recarregar  recarrega a lista do cadastro
//  achar       (listaRecarregada, form) => codigo — quando a API não devolve o código gerado
//  aoCriar     (codigo, form, criado) => void  — normalmente seleciona o registro novo (só se houver código)
//  aoSalvar    (codigo, form, criado) => void  — sempre chamado após salvar (ex.: fechar o modal)
export default function useCadastroRapido({ empty, api, idKey, validar, sucesso, erro, recarregar, achar, aoCriar, aoSalvar }) {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const cancelar = () => { setShow(false); setForm(empty) }
  const isDirty = show && JSON.stringify(form) !== JSON.stringify(empty)

  const salvar = async () => {
    const msg = validar?.(form)
    if (msg) { toast.error(msg); return }
    setSaving(true)
    try {
      const criado = await api.create(form)
      toast.success(sucesso)
      const lista = await recarregar?.()
      const codigo = criado?.[idKey] ?? criado?.id ?? achar?.(lista, form)
      if (codigo) aoCriar?.(codigo, form, criado)
      aoSalvar?.(codigo, form, criado)
      setShow(false)
      setForm(empty)
    } catch {
      toast.error(erro)
    } finally {
      setSaving(false)
    }
  }

  return { show, setShow, form, upd, saving, salvar, cancelar, isDirty }
}
