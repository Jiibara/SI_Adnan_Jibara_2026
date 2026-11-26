import { useState } from 'react'
import useLista from '@/hooks/useLista'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import { formaPagamentosApi } from '@/services/api'
import { FORMA_PAGAMENTO_NOVA_EMPTY } from '@/constants/cadastros'

// Consulta de Formas de Pagamento para as parcelas de uma condição, com cadastro rápido.
//  aoEscolher(indiceParcela, codFormaPagamento)
// Use com <ConsultaForma ctrl={...} />.
export default function useConsultaForma({ aoEscolher }) {
  const [formas, recarregar] = useLista(formaPagamentosApi)
  const [parcela, setParcela] = useState(null)   // índice da parcela que está escolhendo
  const aberto = parcela !== null

  const fechar = () => setParcela(null)

  const nova = useCadastroRapido({
    empty: FORMA_PAGAMENTO_NOVA_EMPTY, api: formaPagamentosApi, idKey: 'codFormaPagamento', recarregar,
    validar: f => !f.formaPagamento.trim() ? 'Preencha a descrição da forma de pagamento.' : null,
    // se a API não devolver o código, procura a forma recém-criada pelo nome
    achar: (lista, f) => lista?.find(x => x.formaPagamento.toLowerCase() === f.formaPagamento.toLowerCase().trim())?.codFormaPagamento,
    sucesso: 'Forma de pagamento adicionada!', erro: 'Erro ao criar forma de pagamento.',
    aoSalvar: cod => {
      if (cod && parcela !== null) aoEscolher(parcela, String(cod))
      fechar()
    },
  })

  return {
    formas, recarregar, aberto, nova, fechar,
    abrir: async i => {
      await recarregar()
      nova.setShow(false)
      setParcela(i)
    },
    selecionar: f => {
      if (parcela !== null) aoEscolher(parcela, String(f.codFormaPagamento))
      fechar()
    },
  }
}
