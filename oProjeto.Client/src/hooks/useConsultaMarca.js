import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import { marcasApi } from '@/services/api'
import { MARCA_EMPTY } from '@/constants/cadastros'

// Consulta de Marcas com cadastro rápido.
//  aoSelecionar(marca)   chamado ao escolher uma marca na lista
//  aoCriar(codigo)       (opcional) chamado após cadastrar uma marca nova
// Use com <ConsultaMarca ctrl={...} />.
export default function useConsultaMarca({ aoSelecionar, aoCriar }) {
  const [marcas, recarregar] = useLista(marcasApi)
  const m = useModais()

  const novaMarca = useCadastroRapido({
    empty: MARCA_EMPTY, api: marcasApi, idKey: 'codMarca', recarregar,
    validar: x => !x.marca?.trim() ? 'Informe a marca.' : null,
    sucesso: 'Marca cadastrada!', erro: 'Erro ao salvar marca.',
    aoCriar: cod => aoCriar?.(cod),
  })

  return {
    m, marcas, novaMarca,
    abrir: () => { novaMarca.setShow(false); m.abrir('marca') },
    aberto: m.algumAberto,
    label: cod => marcas.find(x => x.codMarca === cod)?.marca ?? '',
    selecionar: r => { aoSelecionar?.(r); m.fechar('marca') },
  }
}
