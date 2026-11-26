import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import { funcoesApi } from '@/services/api'
import { FUNCAO_EMPTY } from '@/constants/cadastros'

// Consulta de Funções/Cargos com cadastro rápido.
//  aoSelecionar(funcao)   chamado ao escolher uma função na lista
//  aoCriar(codigo)        (opcional) chamado após cadastrar uma função nova
// Use com <ConsultaFuncao ctrl={...} />.
export default function useConsultaFuncao({ aoSelecionar, aoCriar }) {
  const [funcoes, recarregar] = useLista(funcoesApi)
  const m = useModais()

  const novaFuncao = useCadastroRapido({
    empty: FUNCAO_EMPTY, api: funcoesApi, idKey: 'codFuncao', recarregar,
    validar: x => !x.funcao?.trim() ? 'Informe a função.' : null,
    sucesso: 'Função cadastrada!', erro: 'Erro ao salvar função.',
    aoCriar: cod => aoCriar?.(cod),
  })

  return {
    m, funcoes, novaFuncao,
    abrir: () => { novaFuncao.setShow(false); m.abrir('funcao') },
    aberto: m.algumAberto,
    label: cod => funcoes.find(x => x.codFuncao === cod)?.funcao ?? '',
    selecionar: r => { aoSelecionar?.(r); m.fechar('funcao') },
  }
}
