// Regras dos campos de formulário, com os tamanhos das colunas do banco (bancoNovo.sql).
// Uso no FField:  <FField ... {...regra('fornecedor')} />
// Uso em outros inputs:  maxLength={REGRAS.fornecedor.maxLength}
//
//  maxLength   tamanho máximo (VARCHAR do banco / quantidade de dígitos)
//  digits      aceita só números (o FField remove o resto enquanto digita)
//  validation  validação extra: cpf, cnpj, cpfcnpj, rg, ie, email, phone, cep, placa, sexo

export const REGRAS = {
  // ── Pessoas (clientes, fornecedores, funcionários, transportadores) ──
  cliente:          { maxLength: 50 },
  fornecedor:       { maxLength: 50 },
  funcionario:      { maxLength: 50 },
  transportador:    { maxLength: 50 },
  apelido:          { maxLength: 50 },
  nomeFantasia:     { maxLength: 50 },
  nomeFantasiaTransp: { maxLength: 100 },
  cpfCnpj:          { maxLength: 14, digits: true },
  rgInscEst:        { maxLength: 13 },
  rgInscEstTransp:  { maxLength: 14 },
  sexo:             { maxLength: 1, validation: 'sexo' },

  // ── Contato / endereço ──
  endereco:         { maxLength: 50 },
  numeroEndereco:   { maxLength: 6, digits: true },
  bairro:           { maxLength: 25 },
  bairroTransp:     { maxLength: 50 },
  complemento:      { maxLength: 25 },
  cep:              { maxLength: 8, digits: true, validation: 'cep' },
  fone:             { maxLength: 15, validation: 'phone' },
  email:            { maxLength: 30, validation: 'email' },
  site:             { maxLength: 50 },

  // ── Localização ──
  pais:             { maxLength: 55 },
  sigla:            { maxLength: 3 },
  ddi:              { maxLength: 5 },
  moeda:            { maxLength: 5 },
  estado:           { maxLength: 20 },
  uf:               { maxLength: 2 },
  cidade:           { maxLength: 40 },
  ddd:              { maxLength: 3, digits: true },

  // ── Veículos ──
  placaVeic:        { maxLength: 8, validation: 'placa' },
  placaMercoSul:    { maxLength: 7, validation: 'placa' },
  modeloVeiculo:    { maxLength: 20 },
  codANTT:          { maxLength: 8 },

  // ── Produtos / cadastros simples ──
  produto:          { maxLength: 25 },
  unidade:          { maxLength: 4 },
  marca:            { maxLength: 20 },
  categoria:        { maxLength: 20 },
  funcao:           { maxLength: 20 },
  ncmSh:            { maxLength: 10, digits: true },
  formaPagamento:   { maxLength: 20 },
  condicaoPagamento:{ maxLength: 10 },

  // ── Notas / compras ──
  numeroNota:       { maxLength: 9, digits: true },
  serieNota:        { maxLength: 3, digits: true },
  modeloNota:       { maxLength: 2, digits: true },
  placaVeiculo:     { maxLength: 8, validation: 'placa' },
  cfop:             { maxLength: 4, digits: true },
  csosn:            { maxLength: 4, digits: true },
  naturezaOperacao: { maxLength: 60 },
}

export const regra = (chave, extra) => ({ ...(REGRAS[chave] ?? {}), ...extra })

// Validação do documento conforme o tipo de pessoa
export const regraCpfCnpj = pj => regra('cpfCnpj', { validation: pj ? 'cnpj' : 'cpf' })
export const regraRgIe = (pj, transp = false) =>
  regra(transp ? 'rgInscEstTransp' : 'rgInscEst', { validation: pj ? 'ie' : 'rg' })
