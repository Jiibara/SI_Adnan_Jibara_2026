import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import { produtosApi, marcasApi, categoriasApi } from '@/services/api'
import { PRODUTO_NOVO_EMPTY, MARCA_EMPTY, CATEGORIA_EMPTY } from '@/constants/cadastros'

// Consulta de Produtos com cadastro rápido de Produto, Marca e Categoria.
//  aoSelecionar({ codProd, produto, unidade, precoVenda, ... })  ao escolher OU cadastrar um produto
// Use com <ConsultaProduto ctrl={...} />.
export default function useConsultaProduto({ aoSelecionar }) {
  const [produtos, loadProdutos] = useLista(produtosApi)
  const [marcas, loadMarcas] = useLista(marcasApi)
  const [categorias, loadCategorias] = useLista(categoriasApi)
  const m = useModais()

  const selecionar = r => { aoSelecionar?.(r); m.fechar('produto') }

  const novoProduto = useCadastroRapido({
    empty: PRODUTO_NOVO_EMPTY, api: produtosApi, idKey: 'codProd', recarregar: loadProdutos,
    validar: p => !p.produto?.trim() ? 'Informe o produto.' : null,
    sucesso: 'Produto cadastrado!', erro: 'Erro ao salvar produto.',
    aoCriar: (cod, p) => selecionar({ codProd: cod, produto: p.produto, unidade: p.unidade, precoVenda: p.precoVenda }),
  })
  const novaMarca = useCadastroRapido({
    empty: MARCA_EMPTY, api: marcasApi, idKey: 'codMarca', recarregar: loadMarcas,
    validar: x => !x.marca?.trim() ? 'Informe a marca.' : null,
    sucesso: 'Marca cadastrada!', erro: 'Erro ao salvar marca.',
    aoCriar: cod => novoProduto.upd('codMarca', cod),
  })
  const novaCategoria = useCadastroRapido({
    empty: CATEGORIA_EMPTY, api: categoriasApi, idKey: 'codCategoria', recarregar: loadCategorias,
    validar: c => !c.categoria?.trim() ? 'Informe a categoria.' : null,
    sucesso: 'Categoria cadastrada!', erro: 'Erro ao salvar categoria.',
    aoCriar: cod => novoProduto.upd('codCategoria', cod),
  })

  return {
    m, produtos, marcas, categorias, novoProduto, novaMarca, novaCategoria, selecionar,
    abrir: () => { novoProduto.setShow(false); m.abrir('produto') },
    aberto: m.isOpen('produto'),
  }
}
