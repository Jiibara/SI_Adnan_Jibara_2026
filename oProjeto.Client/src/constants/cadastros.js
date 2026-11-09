// Formulários vazios do cadastro rápido e colunas das consultas, usados por várias telas.
import { fmtMoney } from '@/utils/format'

export const CIDADE_EMPTY = { cidade: '', ddd: '', codEstado: null, ativo: true }
export const ESTADO_EMPTY = { estado: '', uf: '', codPais: null, ativo: true }
export const PAIS_EMPTY = { pais: '', sigla: '', ddi: '', moeda: '', ativo: true }
export const PRODUTO_NOVO_EMPTY = {
  produto: '', unidade: '', precoCompra: 0, precoVenda: 0, custoMedio: 0, saldo: 0,
  pesoBruto: 0, pesoLiq: 0, codMarca: null, codCategoria: null, ativo: true,
}
export const MARCA_EMPTY = { marca: '', ativo: true }
export const CATEGORIA_EMPTY = { categoria: '', ativo: true }
export const CONDICAO_NOVA_EMPTY = { condicaoPagamento: '', ativo: true, parcelas: [] }
export const FORMA_PAGAMENTO_NOVA_EMPTY = { formaPagamento: '', ativo: true }
export const FORNECEDOR_NOVO_EMPTY = { tipoPessoa: 'PJ', fornecedor: '', cpfCnpj: '', codCidade: null, ativo: true }
export const CLIENTE_NOVO_EMPTY = { tipoPessoa: 'PJ', cliente: '', cpfCnpj: '', codCidade: null, ativo: true }

export const colsFornecedores = [
  { key: 'codForn', label: 'Cód.', mono: true },
  { key: 'fornecedor', label: 'Fornecedor' },
]

export const colsClientes = [
  { key: 'codCliente', label: 'Cód.', mono: true },
  { key: 'cliente', label: 'Cliente', render: r => r.cliente ?? r.nome ?? r.razaoSocial ?? '' },
  { key: 'cpfCnpj', label: 'CPF/CNPJ', render: r => r.cpfCnpj ?? '' },
]

export const colsFormasPagamento = [
  { key: 'codFormaPagamento', label: 'Cód.', mono: true },
  { key: 'formaPagamento', label: 'Forma de Pagamento' },
]

export const colsCondicoes = [
  { key: 'codCondicao', label: 'Cód.', mono: true },
  { key: 'condicaoPagamento', label: 'Descrição' },
]

export const colsTransportadoras = [
  { key: 'codTransp', label: 'Cód.', mono: true },
  { key: 'transportador', label: 'Transportadora', render: r => r.transportador ?? r.nome ?? '' },
]

export const colsProdutos = [
  { key: 'codProd', label: 'Cód.', mono: true },
  { key: 'produto', label: 'Produto' },
  { key: 'unidade', label: 'Unidade' },
]

export const colsProdutosComPreco = [
  ...colsProdutos,
  { key: 'precoVenda', label: 'Preço Venda', render: r => fmtMoney(r.precoVenda), align: 'right' },
]

export const colsCidades = [
  { key: 'codCidade', label: 'Cód.', mono: true },
  { key: 'cidade', label: 'Cidade' },
  { key: 'estado', label: 'Estado', render: r => r.estado?.uf ?? '' },
]

export const colsEstados = [
  { key: 'codEstado', label: 'Cód.', mono: true },
  { key: 'estado', label: 'Estado' },
  { key: 'uf', label: 'UF' },
  { key: 'pais', label: 'País', render: r => r.pais?.pais ?? '' },
]

export const colsPaises = [
  { key: 'codPais', label: 'Cód.', mono: true },
  { key: 'pais', label: 'País' },
  { key: 'sigla', label: 'Sigla' },
  { key: 'ddi', label: 'DDI' },
  { key: 'moeda', label: 'Moeda' },
]

export const colsMarcas = [
  { key: 'codMarca', label: 'Cód.', mono: true },
  { key: 'marca', label: 'Marca' },
]

export const colsCategorias = [
  { key: 'codCategoria', label: 'Cód.', mono: true },
  { key: 'categoria', label: 'Categoria' },
]
