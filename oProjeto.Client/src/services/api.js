import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

function crud(path) {
  return {
    getAll:  ()           => api.get(path).then(r => r.data),
    getOne:  (id)         => api.get(`${path}/${id}`).then(r => r.data),  //linha 8
    create:  (body)       => api.post(path, body).then(r => r.data),
    update:  (id, body)   => api.put(`${path}/${id}`, body),
    delete:  (id)         => api.delete(`${path}/${id}`),
  }
}

export const paisesApi = crud('/Paises')
export const estadosApi = crud('/Estados')
export const cidadesApi = crud('/Cidades')
export const fornecedoresApi = crud('/Fornecedores')
export const transportadoresApi = crud('/Transportadores')
export const veiculosApi = crud('/Veiculos')
export const ncmApi = crud('/NcmShs')
export const produtosApi = crud('/Produtos')
export const formaPagamentosApi = crud('/FormaPagamentos')
export const condicoesApi = crud('/CondicaoPagamentos')
export const marcasApi = crud('/Marcas')
export const categoriasApi = crud('/Categorias')
export const funcoesApi = crud('/Funcoes')
export const funcionariosApi = crud('/Funcionarios')
export const clientesApi = crud('/Clientes')
export const nfeApi = crud('/Nfe')
export const notasEntradaApi = crud('/notasentrada')
export const notasSaidaApi = crud('/notasSaida')
// chave da parcela na URL: número/modelo/série/parceiro[/parcela]
const chaveConta = (c, codParceiro, comParcela = true) =>
  [c.notaNumero, c.notaModelo, c.notaSerie, codParceiro, ...(comParcela ? [c.numeroParcela] : [])]
    .map(v => encodeURIComponent(v)).join('/')

export const contasAvsApi = {
  ...crud('/ContasPagarAvulsa'),
  pagar: (c, body) => api.put(`/ContasPagarAvulsa/pagar/${chaveConta(c, c.codForn)}`, body),
  cancelar: c => api.put(`/ContasPagarAvulsa/cancelar/${chaveConta(c, c.codForn, false)}`),
}
export const servicosApi = crud('/servicos')
export const notasServicoApi = crud('/notasServico')

export const comprasApi = {
  ...crud('/Compras'),
  getPendentes: (codForn) => api.get(`/Compras/pendentes/${codForn}`).then(r => r.data),
}

export const movimentoApi = {
  getAll: async () => {
    const r = await fetch('/api/MovimentosEstoque')
    if (!r.ok) throw new Error('Erro ao carregar movimentos')
    return r.json()
  },
  getByProduto: async codProd => {
    const r = await fetch(`/api/MovimentosEstoque/produto/${codProd}`)
    if (!r.ok) throw new Error('Erro ao carregar movimentos do produto')
    return r.json()
  }
}


/*export const notasEntradaApi = {
  getAll: () =>
    http.get('/notasentrada').then(r => r.data),
 
  getByChave: (numero, modelo, serie, codForn) =>
    http.get(`/notasentrada/${numero}/${modelo}/${serie}/${codForn}`).then(r => r.data),
 
  create: (data) =>
    http.post('/notasentrada', data).then(r => r.data),
 
  update: (numero, modelo, serie, codForn, data) =>
    http.put(`/notasentrada/${numero}/${modelo}/${serie}/${codForn}`, data).then(r => r.data),
 
  delete: (numero, modelo, serie, codForn) =>
    http.delete(`/notasentrada/${numero}/${modelo}/${serie}/${codForn}`),
}*/


/*export const nfeApi = {
  getAll:  ()                        => api.get('/Nfes').then(r => r.data),
  getOne:  (n, s, m)                 => api.get(`/Nfes/${n}/${s}/${m}`).then(r => r.data),
  create:  (body)                    => api.post('/Nfes', body).then(r => r.data),
  update:  (n, s, m, body)           => api.put(`/Nfes/${n}/${s}/${m}`, body),
  delete:  (n, s, m)                 => api.delete(`/Nfes/${n}/${s}/${m}`),
}*/

export const prodNfeApi = {
  getAll:  ()                        => api.get('/ProdNfe').then(r => r.data),
  create:  (body)                    => api.post('/ProdNfe', body).then(r => r.data),
  update:  (n, s, m, cp, body)       => api.put(`/ProdNfe/${n}/${s}/${m}/${cp}`, body),
  delete:  (n, s, m, cp)             => api.delete(`/ProdNfe/${n}/${s}/${m}/${cp}`),
}

export const contasPagarApi = {
  getAll: ()        => api.get('/ContasPagar').then(r => r.data),
  pagar:  (c, body) => api.put(`/ContasPagar/pagar/${chaveConta(c, c.codForn)}`, body),
}

// sem ?tipo, o getAll devolve produto e serviço juntos (campo tipoNota);
// na baixa, o tipo diz em qual tabela baixar a parcela
export const contasReceberApi = {
  getAll:  ()        => api.get('/ContasReceber').then(r => r.data),
  receber: (c, body) => api.put(`/ContasReceber/receber/${chaveConta(c, c.codCliente)}`, body, { params: { tipo: c.tipoNota } }),
}

// mensagem de erro devolvida pelo servidor (texto) ou a mensagem padrão
export const mensagemErro = (error, padrao) => {
  const d = error?.response?.data
  if (typeof d === 'string' && d.trim()) return d
  return d?.message || d?.title || padrao
}

export const logsApi = {
  getAll: async () => (await api.get('/Logs')).data
}

export default api
