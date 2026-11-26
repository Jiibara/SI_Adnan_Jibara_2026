import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import { categoriasApi } from '@/services/api'
import { CATEGORIA_EMPTY } from '@/constants/cadastros'

// Consulta de Categorias com cadastro rápido.
//  aoSelecionar(categoria)   chamado ao escolher uma categoria na lista
//  aoCriar(codigo)           (opcional) chamado após cadastrar uma categoria nova
// Use com <ConsultaCategoria ctrl={...} />.
export default function useConsultaCategoria({ aoSelecionar, aoCriar }) {
  const [categorias, recarregar] = useLista(categoriasApi)
  const m = useModais()

  const novaCategoria = useCadastroRapido({
    empty: CATEGORIA_EMPTY, api: categoriasApi, idKey: 'codCategoria', recarregar,
    validar: x => !x.categoria?.trim() ? 'Informe a categoria.' : null,
    sucesso: 'Categoria cadastrada!', erro: 'Erro ao salvar categoria.',
    aoCriar: cod => aoCriar?.(cod),
  })

  return {
    m, categorias, novaCategoria,
    abrir: () => { novaCategoria.setShow(false); m.abrir('categoria') },
    aberto: m.algumAberto,
    label: cod => categorias.find(x => x.codCategoria === cod)?.categoria ?? '',
    selecionar: r => { aoSelecionar?.(r); m.fechar('categoria') },
  }
}
