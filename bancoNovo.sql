-- ───────────────────────────────────────────────────────
-- 1. PAISES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paises (
  codPais INT NOT NULL AUTO_INCREMENT,
  Pais VARCHAR(55) DEFAULT NULL,
  sigla CHAR(3) DEFAULT NULL,
  DDI VARCHAR(5) DEFAULT NULL,
  moeda VARCHAR(5) DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codPais)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 2. ESTADOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estados (
  codEstado INT NOT NULL AUTO_INCREMENT,
  estado VARCHAR(20) DEFAULT NULL,
  UF CHAR(2) DEFAULT NULL,
  codPais INT DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codEstado),
  CONSTRAINT fk_estados_pais FOREIGN KEY (codPais) REFERENCES paises (codPais)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 3. CIDADES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cidades (
  codCidade INT NOT NULL AUTO_INCREMENT,
  cidade VARCHAR(40) DEFAULT NULL,
  DDD VARCHAR(4) DEFAULT NULL,
  codEstado INT DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codCidade),
  CONSTRAINT fk_cidades_estado FOREIGN KEY (codEstado) REFERENCES estados (codEstado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 4. FORMA DE PAGAMENTOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS formapagamentos (
  codFormaPagamento INT NOT NULL AUTO_INCREMENT,
  formaPagamento VARCHAR(20) NOT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 5. CONDIÇÃO DE PAGAMENTOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS condicaopagamentos (
  codCondicao INT NOT NULL AUTO_INCREMENT,
  condicaoPagamento VARCHAR(10) NOT NULL,
  numeroParcelas INT DEFAULT NULL,
  percentualJuros DECIMAL(10,2) DEFAULT '0.00',
  percentualMultas DECIMAL(10,2) DEFAULT '0.00',
  percentualDesconto DECIMAL(10,2) DEFAULT '0.00',
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codCondicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 6. PARCELAS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcelas (
  codCondicao INT NOT NULL,
  numeroParcela INT NOT NULL,
  percentual DECIMAL(5,2) NOT NULL,
  dias INT NOT NULL,
  codFormaPagamento INT DEFAULT NULL,
  PRIMARY KEY (codCondicao, numeroParcela),
  CONSTRAINT fk_parcelas_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao),
  CONSTRAINT fk_parcelas_formapagament FOREIGN KEY (codFormaPagamento) REFERENCES formapagamentos (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 7. MARCAS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marcas (
  codMarca INT NOT NULL AUTO_INCREMENT,
  marca VARCHAR(20) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (codMarca)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 8. CATEGORIAS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  codCategoria INT NOT NULL AUTO_INCREMENT,
  categoria VARCHAR(20) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (codCategoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 9. NCM/SH
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ncmshs (
  ncmSh VARCHAR(10) NOT NULL,
  aliqIcms DECIMAL(10,2) DEFAULT NULL,
  aliqIpi DECIMAL(10,2) DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (ncmSh)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 10. PRODUTOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  codProd INT NOT NULL AUTO_INCREMENT,
  produto VARCHAR(25) DEFAULT NULL,
  unidade VARCHAR(4) DEFAULT NULL,
  ncmSh VARCHAR(10) DEFAULT NULL,
  pesoBruto DECIMAL(10,2) DEFAULT NULL,
  pesoLiq DECIMAL(10,2) DEFAULT NULL,
  saldo DECIMAL(10,2) DEFAULT NULL,
  precoCompra DECIMAL(10,2) DEFAULT '0.00',
  precoVenda DECIMAL(10,2) DEFAULT '0.00',
  custoMedio DECIMAL(10,2) DEFAULT NULL,
  codCategoria INT DEFAULT NULL,
  codMarca INT DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codProd),
  CONSTRAINT fk_prod_ncm FOREIGN KEY (ncmSh) REFERENCES ncmshs (ncmSh),
  CONSTRAINT fk_prod_categoria FOREIGN KEY (codCategoria) REFERENCES categorias (codCategoria),
  CONSTRAINT fk_prod_marca FOREIGN KEY (codMarca) REFERENCES marcas (codMarca)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 11. CLIENTES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  codCliente INT NOT NULL AUTO_INCREMENT,
  cliente VARCHAR(50) NOT NULL,
  apelido VARCHAR(50) NOT NULL,
  endereco VARCHAR(50) DEFAULT NULL,
  bairro VARCHAR(25) DEFAULT NULL,
  numero INT DEFAULT NULL,
  complemento VARCHAR(25) DEFAULT NULL,
  cep VARCHAR(8) DEFAULT NULL,
  codCidade INT DEFAULT NULL,
  fone VARCHAR(15) DEFAULT NULL,
  email VARCHAR(30) DEFAULT NULL,
  codCondicao INT DEFAULT NULL,
  cpfcnpj VARCHAR(14) DEFAULT NULL,
  RgInscEst VARCHAR(13) DEFAULT NULL,
  tipoPessoa CHAR(2) NOT NULL DEFAULT 'PF',
  dataNascimento DATE DEFAULT NULL,
  sexo CHAR(1) DEFAULT NULL,
  limiteCredito INT DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codCliente),
  CONSTRAINT fk_cliente_cidade FOREIGN KEY (codCidade) REFERENCES cidades (codCidade),
  CONSTRAINT fk_cliente_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 12. FORNECEDORES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fornecedores (
  codForn INT NOT NULL AUTO_INCREMENT,
  fornecedor VARCHAR(50) DEFAULT NULL,
  nomeFantasia VARCHAR(50) DEFAULT NULL,
  endereco VARCHAR(50) DEFAULT NULL,
  bairro VARCHAR(25) DEFAULT NULL,
  numero INT DEFAULT NULL,
  complemento VARCHAR(25) DEFAULT NULL,
  cep VARCHAR(8) DEFAULT NULL,
  fone VARCHAR(15) DEFAULT NULL,
  email VARCHAR(30) DEFAULT NULL,
  site VARCHAR(50) DEFAULT NULL,
  RgInscEst VARCHAR(13) DEFAULT NULL,
  InscEstSubTrib VARCHAR(13) DEFAULT NULL,
  cpfcnpj VARCHAR(14) DEFAULT NULL,
  tipoPessoa CHAR(2) NOT NULL DEFAULT 'PJ',
  codCidade INT DEFAULT NULL,
  codCondicao INT DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codForn),
  CONSTRAINT fk_forn_cidade FOREIGN KEY (codCidade) REFERENCES cidades (codCidade),
  CONSTRAINT fk_forn_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 13. VEÍCULOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS veiculos (
  codVeic INT NOT NULL AUTO_INCREMENT,
  placaVeic VARCHAR(11) DEFAULT NULL,
  placaMercoSul VARCHAR(7) DEFAULT NULL,
  modelo VARCHAR(20) DEFAULT NULL,
  codANTT VARCHAR(8) DEFAULT NULL,
  codEstado INT DEFAULT NULL,
  codMarca INT DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codVeic),
  CONSTRAINT fk_veic_estado FOREIGN KEY (codEstado) REFERENCES estados (codEstado),
  CONSTRAINT fk_veic_marca FOREIGN KEY (codMarca) REFERENCES marcas (codMarca)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 14. TRANSPORTADORES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transportadores (
  codTransp INT NOT NULL AUTO_INCREMENT,
  transportador VARCHAR(50) DEFAULT NULL,
  nomeFantasia VARCHAR(100) DEFAULT NULL,
  endereco VARCHAR(50) DEFAULT NULL,
  bairro VARCHAR(50) DEFAULT NULL,
  numero INT DEFAULT NULL,
  complemento VARCHAR(25) DEFAULT NULL,
  cep VARCHAR(8) DEFAULT NULL,
  fone VARCHAR(15) DEFAULT NULL,
  email VARCHAR(30) DEFAULT NULL,
  site VARCHAR(50) DEFAULT NULL,
  RgInscEst VARCHAR(14) DEFAULT NULL,
  CpfCnpj VARCHAR(14) DEFAULT NULL,
  tipoPessoa CHAR(2) NOT NULL DEFAULT 'PJ',
  codCidade INT DEFAULT NULL,
  codCondicao INT DEFAULT NULL,
  codVeic INT DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codTransp),
  CONSTRAINT fk_transp_cidade FOREIGN KEY (codCidade) REFERENCES cidades (codCidade),
  CONSTRAINT fk_transp_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao),
  CONSTRAINT fk_transp_veic FOREIGN KEY (codVeic) REFERENCES veiculos (codVeic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 15. FUNÇÕES FUNCIONÁRIO
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funcoes (
  codFuncao INT NOT NULL AUTO_INCREMENT,
  funcao VARCHAR(20) NOT NULL,
  salarioBase DECIMAL(10, 2) NOT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codFuncao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 16. FUNCIONÁRIOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funcionarios (
  codFunc INT NOT NULL AUTO_INCREMENT,
  funcionario VARCHAR(50) NOT NULL,
  apelido VARCHAR(50) NOT NULL,
  endereco VARCHAR(50) DEFAULT NULL,
  bairro VARCHAR(25) DEFAULT NULL,
  numero INT DEFAULT NULL,
  complemento VARCHAR(25) DEFAULT NULL,
  cep VARCHAR(8) DEFAULT NULL,
  codCidade INT DEFAULT NULL,
  fone VARCHAR(15) DEFAULT NULL,
  email VARCHAR(30) DEFAULT NULL,
  cpfcnpj VARCHAR(14) DEFAULT NULL,
  RgInscEst VARCHAR(13) DEFAULT NULL,
  tipoPessoa CHAR(2) NOT NULL DEFAULT 'PF',
  dataNascimento DATE DEFAULT NULL,
  sexo CHAR(1) DEFAULT NULL,
  dataAdmissao DATE NOT NULL,
  dataDemissao DATE DEFAULT NULL,
  salario DECIMAL(10, 2) NOT NULL,
  codFuncao INT DEFAULT NULL,
  ativo TINYINT(1) DEFAULT NULL,
  PRIMARY KEY (codFunc),
  CONSTRAINT fk_func_cidade FOREIGN KEY (codCidade) REFERENCES cidades (codCidade),
  CONSTRAINT fk_func_funcao FOREIGN KEY (codFuncao) REFERENCES funcoes (codFuncao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 17. MODELO COMPLETO: NFES (COMPLETA COM DADOS FISCAIS)
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nfes (
  numero INT NOT NULL,
  serie INT NOT NULL,
  modelo INT NOT NULL,
  codForn INT NOT NULL,
  chaveAcesso VARCHAR(44) DEFAULT NULL,
  naturezaOperacao VARCHAR(60) DEFAULT NULL,
  dataEmissao DATE NOT NULL,
  dataChegada DATE DEFAULT NULL,
  tipoFrete CHAR(3) NOT NULL,
  baseCalcIcms DECIMAL(10,2) DEFAULT '0.00',
  valorIcms DECIMAL(10,2) DEFAULT '0.00',
  baseCalcIcmsSt DECIMAL(10,2) DEFAULT '0.00',
  valorIcmsSt DECIMAL(10,2) DEFAULT '0.00',
  valorIpi DECIMAL(10,2) DEFAULT '0.00',
  valorPis DECIMAL(10,2) DEFAULT '0.00',
  valorCofins DECIMAL(10,2) DEFAULT '0.00',
  valorProdutos DECIMAL(10,2) NOT NULL,
  valorFrete DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  valorSeguro DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  outrasDespesas DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  valorDesconto DECIMAL(10,2) NOT NULL DEFAULT '0.00',
  valorTotal DECIMAL(10,2) NOT NULL,
  codCondicao INT DEFAULT NULL,
  codTransp INT DEFAULT NULL,
  placaVeic VARCHAR(11) DEFAULT NULL,
  observacoes TEXT,
  situacao VARCHAR(20) DEFAULT 'PENDENTE',
  PRIMARY KEY (numero,serie,modelo,codForn),
  CONSTRAINT fk_nfe_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao),
  CONSTRAINT fk_nfe_forn FOREIGN KEY (codForn) REFERENCES fornecedores (codForn),
  CONSTRAINT fk_nfe_transp FOREIGN KEY (codTransp) REFERENCES transportadores (codTransp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 18. MODELO COMPLETO: PRODNFES (ITENS COM DADOS FISCAIS)
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prodnfes (
  numero INT NOT NULL,
  serie INT NOT NULL,
  modelo INT NOT NULL,
  codForn INT NOT NULL,
  codProd INT NOT NULL,
  cfop VARCHAR(4) DEFAULT NULL,
  csosn VARCHAR(4) DEFAULT NULL,
  quantidade INT NOT NULL,
  valorUnitario DECIMAL(10,2) NOT NULL,
  valorTotal DECIMAL(10,2) NOT NULL,
  baseCalcIcms DECIMAL(10,2) DEFAULT '0.00',
  aliqIcms DECIMAL(5,2) DEFAULT '0.00',
  valorIcms DECIMAL(10,2) DEFAULT '0.00',
  aliqIpi DECIMAL(5,2) DEFAULT '0.00',
  valorIpi DECIMAL(10,2) DEFAULT '0.00',
  PRIMARY KEY (numero,serie,modelo,codForn,codProd),
  CONSTRAINT fk_prodnfe_nfe FOREIGN KEY (numero, serie, modelo, codForn) REFERENCES nfes (numero, serie, modelo, codForn) ON DELETE CASCADE,
  CONSTRAINT fk_prodnfe_produto FOREIGN KEY (codProd) REFERENCES produtos (codProd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 19. NOTAS DE ENTRADA (COMPRAS NOVAS)
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notasEntrada (
  numero INT NOT NULL,
  serie INT NOT NULL,
  modelo INT NOT NULL,
  codForn INT NOT NULL,
  dataEmissao DATE NOT NULL DEFAULT (CURRENT_DATE),
  dataChegada DATE DEFAULT NULL,
  tipoFrete CHAR(3) NOT NULL,
  valorProdutos DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  valorFrete DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  valorSeguro DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  outrasDespesas DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  valorDesconto DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  valorTotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  codCondicao INT DEFAULT NULL,
  codTransp INT DEFAULT NULL,
  placaVeiculo VARCHAR(11) DEFAULT NULL,
  observacoes TEXT DEFAULT NULL,
  situacao VARCHAR(20) DEFAULT 'PENDENTE',
  PRIMARY KEY (numero, modelo, serie, codForn),
  CONSTRAINT fk_nota_entrada_fornecedor FOREIGN KEY (codForn) REFERENCES fornecedores (codForn),
  CONSTRAINT fk_nota_entrada_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao),
  CONSTRAINT fk_nota_entrada_transportadora FOREIGN KEY (codTransp) REFERENCES transportadores (codTransp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 20. PRODUTOS DA NOTA DE ENTRADA
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtosNotaEntrada (
  numero INT NOT NULL,
  modelo INT NOT NULL,
  serie INT NOT NULL,
  codForn INT NOT NULL,
  codProd INT NOT NULL,
  quantidade INT NOT NULL,
  valorUnitario DECIMAL(10,2) NOT NULL,
  valorTotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (numero, modelo, serie, codForn, codProd),
  CONSTRAINT fk_itnfe_nota FOREIGN KEY (numero, modelo, serie, codForn) REFERENCES notasEntrada (numero, modelo, serie, codForn) ON DELETE CASCADE,
  CONSTRAINT fk_itnfe_produto FOREIGN KEY (codProd) REFERENCES produtos (codProd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 21. NOTAS DE SAÍDA (VENDAS NOVAS)
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notasSaida (
  numero INT NOT NULL,
  serie INT NOT NULL,
  modelo INT NOT NULL,
  codCliente INT NOT NULL,
  dataEmissao DATE NOT NULL DEFAULT (CURRENT_DATE),
  dataSaida DATE DEFAULT NULL,
  tipoFrete CHAR(3) NOT NULL,
  valorProdutos DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  valorFrete DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  valorSeguro DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  outrasDespesas DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  valorDesconto DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  valorTotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  codCondicao INT DEFAULT NULL,
  codTransp INT DEFAULT NULL,
  placaVeiculo VARCHAR(11) DEFAULT NULL,
  observacoes TEXT DEFAULT NULL,
  situacao VARCHAR(20) DEFAULT 'PENDENTE',
  PRIMARY KEY (numero, modelo, serie, codCliente),
  CONSTRAINT fk_nota_saida_cliente FOREIGN KEY (codCliente) REFERENCES clientes (codCliente),
  CONSTRAINT fk_nota_saida_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao),
  CONSTRAINT fk_nota_saida_transportadora FOREIGN KEY (codTransp) REFERENCES transportadores (codTransp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 22. PRODUTOS DA NOTA DE SAÍDA
-- ───────────────────────────────────────────────────────
CREATE TABLE produtosNotaSaida (
    numero INT NOT NULL,
    serie INT NOT NULL,
    modelo INT NOT NULL,
    codCliente INT NOT NULL,
    codProd INT NOT NULL,
    quantidade INT NOT NULL,
    valorUnitario DECIMAL(10,2) NOT NULL,
    valorTotal DECIMAL(10,2) NOT NULL,
    rateioFrete DECIMAL(10,2) NOT NULL,
    rateioSeguro DECIMAL(10,2) NOT NULL,
    rateioOutras DECIMAL(10,2) NOT NULL,
    custoFinal DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (numero, serie, modelo, codCliente, codProd),
    CONSTRAINT fk_itnfs_nota FOREIGN KEY (numero, modelo, serie, codCliente) REFERENCES notasSaida (numero, modelo, serie, codCliente) ON DELETE CASCADE,
    CONSTRAINT fk_itnfs_produto FOREIGN KEY (codProd) REFERENCES produtos (codProd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 23. CONTAS A PAGAR
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contasPagar (
  codContaPagar INT AUTO_INCREMENT PRIMARY KEY,
  notaNumero INT NOT NULL,
  notaModelo INT NOT NULL,
  notaSerie INT NOT NULL,
  codForn INT NOT NULL,
  numeroParcela INT NOT NULL,
  totalParcelas INT NOT NULL,
  valorOriginal DECIMAL(10, 2) NOT NULL,
  valorPago DECIMAL(10, 2) DEFAULT 0.00,
  valorDesconto DECIMAL(10, 2) DEFAULT 0.00,
  valorJuros DECIMAL(10, 2) DEFAULT 0.00,
  valorMulta DECIMAL(10, 2) DEFAULT 0.00,
  valorTotal DECIMAL(10, 2) NOT NULL,
  dataEmissao DATE NOT NULL,
  dataVencimento DATE NOT NULL,
  dataPagamento DATE DEFAULT NULL,
  codFormaPagamento INT DEFAULT NULL,
  situacao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  observacoes TEXT DEFAULT NULL,
  CONSTRAINT fk_contas_pagar_nota FOREIGN KEY (notaNumero, notaModelo, notaSerie, codForn) REFERENCES notasEntrada (numero, modelo, serie, codForn) ON DELETE CASCADE,
  CONSTRAINT fk_contas_pagar_fornecedor FOREIGN KEY (codForn) REFERENCES fornecedores (codForn),
  CONSTRAINT fk_contas_pagar_forma_pagto FOREIGN KEY (codFormaPagamento) REFERENCES formapagamentos (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 24. CONTAS A RECEBER
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contasReceber (
  codContaReceber INT AUTO_INCREMENT PRIMARY KEY,
  notaNumero INT DEFAULT NULL,
  notaModelo INT DEFAULT NULL,
  notaSerie INT DEFAULT NULL,
  codCliente INT NOT NULL,
  numeroParcela INT NOT NULL,
  totalParcelas INT NOT NULL,
  valorOriginal DECIMAL(10, 2) NOT NULL,
  valorRecebido DECIMAL(10, 2) DEFAULT 0.00,
  valorDesconto DECIMAL(10, 2) DEFAULT 0.00,
  valorJuros DECIMAL(10, 2) DEFAULT 0.00,
  valorMulta DECIMAL(10, 2) DEFAULT 0.00,
  valorTotal DECIMAL(10, 2) NOT NULL,
  dataEmissao DATE NOT NULL DEFAULT (CURRENT_DATE),
  dataVencimento DATE NOT NULL,
  dataRecebimento DATE DEFAULT NULL,
  codFormaPagamento INT DEFAULT NULL,
  situacao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  observacoes TEXT DEFAULT NULL,
  CONSTRAINT fk_contas_receber_nota FOREIGN KEY (notaNumero, notaModelo, notaSerie, codCliente) REFERENCES notasSaida (numero, modelo, serie, codCliente) ON DELETE CASCADE,
  CONSTRAINT fk_contas_receber_cliente FOREIGN KEY (codCliente) REFERENCES clientes (codCliente),
  CONSTRAINT fk_contas_receber_forma_pagto FOREIGN KEY (codFormaPagamento) REFERENCES formapagamentos (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 25. LOGS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logs (
  CodLog INT NOT NULL AUTO_INCREMENT,
  Entidade VARCHAR(20) NOT NULL,
  Acao VARCHAR(20) NOT NULL,
  Descricao VARCHAR(255) NOT NULL,
  CriadoEm DATETIME NOT NULL,
  PRIMARY KEY (CodLog)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



CREATE TABLE compras (
    numero INT NOT NULL,
    serie INT NOT NULL,
    modelo INT NOT NULL,
    codForn INT NOT NULL,
    dataCompra DATE NOT NULL DEFAULT (CURRENT_DATE),
    dataPrevisaoEntrega DATE DEFAULT NULL,
    codCondicao INT DEFAULT NULL,
    valorProdutos DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valorDesconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valorFrete DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valorSeguro DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    outrasDespesas DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valorTotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    observacoes TEXT DEFAULT NULL,
    situacao VARCHAR(20) NOT NULL DEFAULT 'ABERTA',
    PRIMARY KEY (numero, modelo, serie, codForn),
    CONSTRAINT fk_compra_fornecedor FOREIGN KEY (codForn) REFERENCES fornecedores(codForn),
    CONSTRAINT fk_compra_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos(codCondicao)
);

CREATE TABLE produtosCompras (
    numero INT NOT NULL,
    serie INT NOT NULL,
    modelo INT NOT NULL,
    codForn INT NOT NULL,
    codProd INT NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    valorUnitario DECIMAL(10,2) NOT NULL,
    descontoPercentual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    descontoValor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valorTotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rateioFrete DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rateioSeguro DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rateioOutras DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    custoFinal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (numero, modelo, serie, codForn, codProd),
    CONSTRAINT fk_produto_compra_compra  FOREIGN KEY (numero, modelo, serie, codForn)  REFERENCES compras(numero, modelo, serie, codForn) ON DELETE CASCADE,
    CONSTRAINT fk_produto_compra_produto FOREIGN KEY (codProd)  REFERENCES produtos(codProd)
);


CREATE TABLE movimentoEstoque (
	modeloNonta INT NOT NULL,
    serieNota INT NOT NULL,
    numeroNota INT NOT NULL,
    codForn INT NOT NULL, 
    codProd INT NOT NULL,
    tipo ENUM('ENTRADA', 'SAIDA') NOT NULL,
    origem ENUM('NOTA_ENTRADA', 'NOTA_SAIDA', 'AJUSTE_MANUAL') NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    custoUnitario DECIMAL(10,2) NOT NULL,
    valorTotal DECIMAL(10,2) NOT NULL,
    saldoAnterior DECIMAL(10,2) NOT NULL,
    saldoPosterior DECIMAL(10,2) NOT NULL,
    custoMedioAnterior DECIMAL(10,2) NOT NULL,
    custoMedioPosterior DECIMAL(10,2)NOT NULL,
    dataMovimento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao VARCHAR(100) NULL,
    PRIMARY KEY (codMovimento)
);







-- =====================================================================
-- MOVIMENTO DE ESTOQUE (sem codMovimento; identificado pela nota)
-- Um movimento por produto em cada nota confirmada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- AJUSTE NA TABELA produtos: saldo e custoMedio já existem, mas com
-- precisão menor que a dos movimentos e aceitando NULL.
-- ---------------------------------------------------------------------
UPDATE produtos SET saldo = 0      WHERE saldo IS NULL;
UPDATE produtos SET custoMedio = 0 WHERE custoMedio IS NULL;

ALTER TABLE produtos
  MODIFY saldo      DECIMAL(12,3) NOT NULL DEFAULT 0,
  MODIFY custoMedio DECIMAL(12,4) NOT NULL DEFAULT 0;


-- ---------------------------------------------------------------------
-- ENTRADA: chave = nota de entrada (numero, modelo, serie, codForn) + produto
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentoEstoqueEntrada (
  numero              INT NOT NULL,
  modelo              INT NOT NULL,
  serie               INT NOT NULL,
  codForn             INT NOT NULL,
  codProd             INT NOT NULL,

  quantidade          DECIMAL(12,3) NOT NULL,
  custoUnitario       DECIMAL(12,4) NOT NULL,  -- custo final (com frete, seguro e despesas rateados)
  valorTotal          DECIMAL(12,2) NOT NULL,
  saldoAnterior       DECIMAL(12,3) NOT NULL,
  saldoPosterior      DECIMAL(12,3) NOT NULL,
  custoMedioAnterior  DECIMAL(12,4) NOT NULL,
  custoMedioPosterior DECIMAL(12,4) NOT NULL,
  dataMovimento       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacao          VARCHAR(100) NULL,

  PRIMARY KEY (numero, modelo, serie, codForn, codProd),

  CONSTRAINT fk_movent_nota
    FOREIGN KEY (numero, modelo, serie, codForn)
    REFERENCES notasEntrada (numero, modelo, serie, codForn),

  CONSTRAINT fk_movent_produto
    FOREIGN KEY (codProd) REFERENCES produtos (codProd),

  CONSTRAINT chk_movent_quantidade CHECK (quantidade > 0),

  INDEX idx_movent_produto_data (codProd, dataMovimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------------------
-- SAIDA: chave = nota de saída (numero, modelo, serie, codCliente) + produto
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentoEstoqueSaida (
  numero              INT NOT NULL,
  modelo              INT NOT NULL,
  serie               INT NOT NULL,
  codCliente          INT NOT NULL,
  codProd             INT NOT NULL,

  quantidade          DECIMAL(12,3) NOT NULL,
  custoUnitario       DECIMAL(12,4) NOT NULL,  -- = custo médio vigente no momento da saída
  valorTotal          DECIMAL(12,2) NOT NULL,
  saldoAnterior       DECIMAL(12,3) NOT NULL,
  saldoPosterior      DECIMAL(12,3) NOT NULL,
  custoMedioAnterior  DECIMAL(12,4) NOT NULL,
  custoMedioPosterior DECIMAL(12,4) NOT NULL,  -- igual ao anterior (saída não altera o custo médio)
  dataMovimento       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacao          VARCHAR(100) NULL,

  PRIMARY KEY (numero, modelo, serie, codCliente, codProd),

  CONSTRAINT fk_movsai_nota
    FOREIGN KEY (numero, modelo, serie, codCliente)
    REFERENCES notasSaida (numero, modelo, serie, codCliente),

  CONSTRAINT fk_movsai_produto
    FOREIGN KEY (codProd) REFERENCES produtos (codProd),

  CONSTRAINT chk_movsai_quantidade CHECK (quantidade > 0),

  INDEX idx_movsai_produto_data (codProd, dataMovimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------------------
-- VIEW: visão única do movimento (extrato do produto)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW movimentoEstoque AS
SELECT
  'ENTRADA'  AS tipo,
  numero, modelo, serie,
  codForn    AS codParceiro,
  codProd,
  quantidade, custoUnitario, valorTotal,
  saldoAnterior, saldoPosterior,
  custoMedioAnterior, custoMedioPosterior,
  dataMovimento, observacao
FROM movimentoEstoqueEntrada
UNION ALL
SELECT
  'SAIDA'    AS tipo,
  numero, modelo, serie,
  codCliente AS codParceiro,
  codProd,
  quantidade, custoUnitario, valorTotal,
  saldoAnterior, saldoPosterior,
  custoMedioAnterior, custoMedioPosterior,
  dataMovimento, observacao
FROM movimentoEstoqueSaida;
