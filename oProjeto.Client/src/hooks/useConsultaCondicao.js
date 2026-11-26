import { useState } from 'react'
import toast from 'react-hot-toast'
import useLista from '@/hooks/useLista'
import useCondicaoForm from '@/hooks/useCondicaoForm'
import useConsultaForma from '@/hooks/useConsultaForma'
import { useModalGuard } from '@/hooks/useModalGuard'
import { condicoesApi } from '@/services/api'

// Consulta de Condição de Pagamento dentro de um cadastro (Fornecedor, Cliente):
// lista para selecionar, com "Nova Condição" e "Editar" no próprio modal.
//  aoSelecionar(codCondicao)   ao escolher uma condição da lista
//  aoCriar(codCondicao)        após cadastrar uma condição nova (normalmente seleciona ela)
// Use com <ConsultaCondicao ctrl={...} />.
export default function useConsultaCondicao({ aoSelecionar, aoCriar }) {
  const [condicoes, recarregar] = useLista(condicoesApi)
  const [aberto, setAberto] = useState(false)
  const [modo, setModo] = useState('lista')      // 'lista' | 'novo' | 'editar'
  const [salvando, setSalvando] = useState(false)
  const ctrl = useCondicaoForm()
  const forma = useConsultaForma({ aoEscolher: (i, cod) => ctrl.updParcela(i, 'codFormaPagamento', cod) })

  const voltarParaLista = () => { ctrl.carregar(); setModo('lista') }

  const fechar = () => { setAberto(false); voltarParaLista() }

  const salvar = async () => {
    const msg = ctrl.erro()
    if (msg) return toast.error(msg)
    setSalvando(true)
    try {
      if (modo === 'editar') {
        await condicoesApi.update(ctrl.form.codCondicao, ctrl.payload())
      } else {
        const criada = await condicoesApi.create(ctrl.payload())
        const cod = criada?.codCondicao ?? criada?.id
        if (cod) aoCriar?.(cod)
      }
      toast.success('Condição salva!')
      await recarregar()
      voltarParaLista()
    } catch {
      toast.error('Erro ao salvar condição.')
    } finally {
      setSalvando(false)
    }
  }

  const guard = useModalGuard({
    isOpen: aberto,
    isDirty: modo !== 'lista' && ctrl.isDirty,
    onClose: fechar,
    onSave: modo !== 'lista' ? salvar : undefined,
    paused: forma.aberto,
  })

  return {
    condicoes, aberto, modo, salvando, ctrl, forma, guard, salvar, voltarParaLista,
    abrir: async () => { await forma.recarregar(); voltarParaLista(); setAberto(true) },
    novo: () => { ctrl.carregar(); setModo('novo') },
    editar: async row => { await forma.recarregar(); ctrl.carregar(row); setModo('editar') },
    selecionar: row => { aoSelecionar?.(row.codCondicao); fechar() },
    label: cod => condicoes.find(c => c.codCondicao === cod)?.condicaoPagamento ?? '',
  }
}
