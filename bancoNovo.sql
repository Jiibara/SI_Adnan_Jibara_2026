-- =====================================================================
-- Projeto Kaneko (oProjeto) — script de criação do banco DevSis (MySQL 8)
--
-- Gerado a partir do SQL usado pelos repositórios em oProjeto.Server/Repository
-- e dos Models em oProjeto.Server/Models (versão de 26/11/2026).
--
-- Ordem: localização → financeiro (formas/condições) → cadastros → compras
--        → notas (entrada/saída/serviço) → estoque → contas → logs.
--
-- Chaves das notas, compras e contas: numero VARCHAR(9), serie VARCHAR(3),
-- modelo VARCHAR(2) (os repositórios leem esses campos com GetString).
-- =====================================================================

-- Para recriar do zero, descomente a linha abaixo (APAGA TODOS OS DADOS):
-- DROP DATABASE IF EXISTS DevSis;

CREATE DATABASE IF NOT EXISTS DevSis
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE DevSis;

-- ───────────────────────────────────────────────────────
-- 1. PAISES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paises (
  codPais INT NOT NULL AUTO_INCREMENT,
  pais    VARCHAR(55) DEFAULT NULL,
  sigla   CHAR(3)     DEFAULT NULL,
  DDI     VARCHAR(5)  DEFAULT NULL,
  moeda   VARCHAR(5)  DEFAULT NULL,
  ativo   TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (codPais)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 2. ESTADOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estados (
  codEstado INT NOT NULL AUTO_INCREMENT,
  estado    VARCHAR(20) DEFAULT NULL,
  UF        CHAR(2)     DEFAULT NULL,
  codPais   INT         DEFAULT NULL,
  ativo     TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (codEstado),
  CONSTRAINT fk_estados_pais FOREIGN KEY (codPais) REFERENCES paises (codPais)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 3. CIDADES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cidades (
  codCidade INT NOT NULL AUTO_INCREMENT,
  cidade    VARCHAR(40) DEFAULT NULL,
  DDD       VARCHAR(4)  DEFAULT NULL,
  codEstado INT         DEFAULT NULL,
  ativo     TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (codCidade),
  CONSTRAINT fk_cidades_estado FOREIGN KEY (codEstado) REFERENCES estados (codEstado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 4. FORMAS DE PAGAMENTO
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS formapagamentos (
  codFormaPagamento INT NOT NULL AUTO_INCREMENT,
  formaPagamento    VARCHAR(20) NOT NULL,
  ativo             TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 5. CONDIÇÕES DE PAGAMENTO
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS condicaopagamentos (
  codCondicao        INT NOT NULL AUTO_INCREMENT,
  condicaoPagamento  VARCHAR(10)   NOT NULL,
  numeroParcelas     INT           DEFAULT NULL,
  percentualJuros    DECIMAL(10,2) DEFAULT 0.00,
  percentualMultas   DECIMAL(10,2) DEFAULT 0.00,
  percentualDesconto DECIMAL(10,2) DEFAULT 0.00,
  ativo              TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (codCondicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 6. PARCELAS DA CONDIÇÃO
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcelas (
  codCondicao       INT          NOT NULL,
  numeroParcela     INT          NOT NULL,
  percentual        DECIMAL(5,2) NOT NULL,
  dias              INT          NOT NULL,
  codFormaPagamento INT          DEFAULT NULL,
  PRIMARY KEY (codCondicao, numeroParcela),
  CONSTRAINT fk_parcelas_condicao      FOREIGN KEY (codCondicao)       REFERENCES condicaopagamentos (codCondicao),
  CONSTRAINT fk_parcelas_formapagament FOREIGN KEY (codFormaPagamento) REFERENCES formapagamentos (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 7. MARCAS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marcas (
  codMarca INT NOT NULL AUTO_INCREMENT,
  marca    VARCHAR(20) NOT NULL,
  ativo    TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (codMarca)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 8. CATEGORIAS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  codCategoria INT NOT NULL AUTO_INCREMENT,
  categoria    VARCHAR(20) NOT NULL,
  ativo        TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (codCategoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 9. NCM/SH  (cadastro ainda não usado pelo ProdutoRepository — mantido para a volta do campo)
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ncmshs (
  ncmSh   VARCHAR(10)   NOT NULL,
  aliqIcms DECIMAL(10,2) DEFAULT NULL,
  aliqIpi  DECIMAL(10,2) DEFAULT NULL,
  ativo    TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (ncmSh)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 10. PRODUTOS
--     saldo/custoMedio com a mesma precisão do movimento de estoque.
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  codProd          INT NOT NULL AUTO_INCREMENT,
  produto          VARCHAR(25)   DEFAULT NULL,
  unidade          VARCHAR(4)    DEFAULT NULL,
  ncmSh            VARCHAR(10)   DEFAULT NULL,
  pesoBruto        DECIMAL(10,2) DEFAULT NULL,
  pesoLiq          DECIMAL(10,2) DEFAULT NULL,
  saldo            DECIMAL(12,3) NOT NULL DEFAULT 0,
  quantidadeMinima DECIMAL(12,3) NOT NULL DEFAULT 0,
  precoCompra      DECIMAL(10,2) DEFAULT 0.00,
  precoVenda       DECIMAL(10,2) DEFAULT 0.00,
  custoMedio       DECIMAL(12,4) NOT NULL DEFAULT 0,
  codCategoria     INT           DEFAULT NULL,
  codMarca         INT           DEFAULT NULL,
  ativo            TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (codProd),
  CONSTRAINT fk_prod_ncm       FOREIGN KEY (ncmSh)        REFERENCES ncmshs (ncmSh),
  CONSTRAINT fk_prod_categoria FOREIGN KEY (codCategoria) REFERENCES categorias (codCategoria),
  CONSTRAINT fk_prod_marca     FOREIGN KEY (codMarca)     REFERENCES marcas (codMarca)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 11. SERVIÇOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicos (
  codServico     INT NOT NULL AUTO_INCREMENT,
  servico        VARCHAR(50)   NOT NULL,
  preco          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duracaoMinutos INT           NOT NULL DEFAULT 0,
  ativo          TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (codServico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 12. CLIENTES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  codCliente     INT NOT NULL AUTO_INCREMENT,
  cliente        VARCHAR(50) NOT NULL,
  apelido        VARCHAR(50) NOT NULL,
  endereco       VARCHAR(50) DEFAULT NULL,
  bairro         VARCHAR(25) DEFAULT NULL,
  numero         INT         DEFAULT NULL,
  complemento    VARCHAR(25) DEFAULT NULL,
  cep            VARCHAR(8)  DEFAULT NULL,
  codCidade      INT         DEFAULT NULL,
  fone           VARCHAR(15) DEFAULT NULL,
  email          VARCHAR(30) DEFAULT NULL,
  codCondicao    INT         DEFAULT NULL,
  cpfcnpj        VARCHAR(14) DEFAULT NULL,
  RgInscEst      VARCHAR(13) DEFAULT NULL,
  tipoPessoa     CHAR(2)     NOT NULL DEFAULT 'PF',
  dataNascimento DATE        DEFAULT NULL,
  sexo           CHAR(1)     DEFAULT NULL,
  limiteCredito  INT         DEFAULT NULL,
  ativo          TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (codCliente),
  CONSTRAINT fk_cliente_cidade   FOREIGN KEY (codCidade)   REFERENCES cidades (codCidade),
  CONSTRAINT fk_cliente_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 13. FORNECEDORES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fornecedores (
  codForn        INT NOT NULL AUTO_INCREMENT,
  fornecedor     VARCHAR(50) DEFAULT NULL,
  nomeFantasia   VARCHAR(50) DEFAULT NULL,
  endereco       VARCHAR(50) DEFAULT NULL,
  bairro         VARCHAR(25) DEFAULT NULL,
  numero         INT         DEFAULT NULL,
  complemento    VARCHAR(25) DEFAULT NULL,
  cep            VARCHAR(8)  DEFAULT NULL,
  fone           VARCHAR(15) DEFAULT NULL,
  email          VARCHAR(30) DEFAULT NULL,
  site           VARCHAR(50) DEFAULT NULL,
  RgInscEst      VARCHAR(13) DEFAULT NULL,
  InscEstSubTrib VARCHAR(13) DEFAULT NULL,
  cpfcnpj        VARCHAR(14) DEFAULT NULL,
  tipoPessoa     CHAR(2)     NOT NULL DEFAULT 'PJ',
  codCidade      INT         DEFAULT NULL,
  codCondicao    INT         DEFAULT NULL,
  ativo          TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (codForn),
  CONSTRAINT fk_forn_cidade   FOREIGN KEY (codCidade)   REFERENCES cidades (codCidade),
  CONSTRAINT fk_forn_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 14. VEÍCULOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS veiculos (
  codVeic       INT NOT NULL AUTO_INCREMENT,
  placaVeic     VARCHAR(11) DEFAULT NULL,
  placaMercoSul VARCHAR(7)  DEFAULT NULL,
  modelo        VARCHAR(20) DEFAULT NULL,
  codANTT       VARCHAR(8)  DEFAULT NULL,
  codEstado     INT         DEFAULT NULL,
  codMarca      INT         DEFAULT NULL,
  ativo         TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (codVeic),
  CONSTRAINT fk_veic_estado FOREIGN KEY (codEstado) REFERENCES estados (codEstado),
  CONSTRAINT fk_veic_marca  FOREIGN KEY (codMarca)  REFERENCES marcas (codMarca)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 15. TRANSPORTADORES
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transportadores (
  codTransp     INT NOT NULL AUTO_INCREMENT,
  transportador VARCHAR(50)  DEFAULT NULL,
  nomeFantasia  VARCHAR(100) DEFAULT NULL,
  endereco      VARCHAR(50)  DEFAULT NULL,
  bairro        VARCHAR(50)  DEFAULT NULL,
  numero        INT          DEFAULT NULL,
  complemento   VARCHAR(25)  DEFAULT NULL,
  cep           VARCHAR(8)   DEFAULT NULL,
  fone          VARCHAR(15)  DEFAULT NULL,
  email         VARCHAR(30)  DEFAULT NULL,
  site          VARCHAR(50)  DEFAULT NULL,
  RgInscEst     VARCHAR(14)  DEFAULT NULL,
  CpfCnpj       VARCHAR(14)  DEFAULT NULL,
  tipoPessoa    CHAR(2)      NOT NULL DEFAULT 'PJ',
  codCidade     INT          DEFAULT NULL,
  codVeic       INT          DEFAULT NULL,
  ativo         TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (codTransp),
  CONSTRAINT fk_transp_cidade FOREIGN KEY (codCidade) REFERENCES cidades (codCidade),
  CONSTRAINT fk_transp_veic   FOREIGN KEY (codVeic)   REFERENCES veiculos (codVeic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 16. FUNÇÕES DE FUNCIONÁRIO
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funcoes (
  codFuncao   INT NOT NULL AUTO_INCREMENT,
  funcao      VARCHAR(20)   NOT NULL,
  salarioBase DECIMAL(10,2) NOT NULL,
  ativo       TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (codFuncao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 17. FUNCIONÁRIOS
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funcionarios (
  codFunc        INT NOT NULL AUTO_INCREMENT,
  funcionario    VARCHAR(50)   NOT NULL,
  apelido        VARCHAR(50)   NOT NULL,
  endereco       VARCHAR(50)   DEFAULT NULL,
  bairro         VARCHAR(25)   DEFAULT NULL,
  numero         INT           DEFAULT NULL,
  complemento    VARCHAR(25)   DEFAULT NULL,
  cep            VARCHAR(8)    DEFAULT NULL,
  codCidade      INT           DEFAULT NULL,
  fone           VARCHAR(15)   DEFAULT NULL,
  email          VARCHAR(30)   DEFAULT NULL,
  cpfcnpj        VARCHAR(14)   DEFAULT NULL,
  RgInscEst      VARCHAR(13)   DEFAULT NULL,
  tipoPessoa     CHAR(2)       NOT NULL DEFAULT 'PF',
  dataNascimento DATE          DEFAULT NULL,
  sexo           CHAR(1)       DEFAULT NULL,
  dataAdmissao   DATE          NOT NULL,
  dataDemissao   DATE          DEFAULT NULL,
  salario        DECIMAL(10,2) NOT NULL,
  codFuncao      INT           DEFAULT NULL,
  ativo          TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (codFunc),
  CONSTRAINT fk_func_cidade FOREIGN KEY (codCidade) REFERENCES cidades (codCidade),
  CONSTRAINT fk_func_funcao FOREIGN KEY (codFuncao) REFERENCES funcoes (codFuncao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 18. COMPRAS (PEDIDOS DE COMPRA)
--     situacao: ABERTA | PARCIAL | CONCLUIDA (| PENDENTE)
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compras (
  numero              VARCHAR(9)    NOT NULL,
  serie               VARCHAR(3)    NOT NULL,
  modelo              VARCHAR(2)    NOT NULL,
  codForn             INT           NOT NULL,
  dataCompra          DATE          NOT NULL DEFAULT (CURRENT_DATE),
  dataPrevisaoEntrega DATE          DEFAULT NULL,
  codCondicao         INT           DEFAULT NULL,
  valorProdutos       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorDesconto       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorFrete          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorSeguro         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  outrasDespesas      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorTotal          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  observacoes         TEXT          DEFAULT NULL,
  situacao            VARCHAR(20)   NOT NULL DEFAULT 'ABERTA',
  PRIMARY KEY (numero, modelo, serie, codForn),
  CONSTRAINT fk_compra_fornecedor FOREIGN KEY (codForn)     REFERENCES fornecedores (codForn),
  CONSTRAINT fk_compra_condicao   FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 19. PRODUTOS DA COMPRA
--     quantidadeRecebida é atualizada ao conferir/cancelar a nota de entrada vinculada.
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtosCompras (
  numero             VARCHAR(9)    NOT NULL,
  serie              VARCHAR(3)    NOT NULL,
  modelo             VARCHAR(2)    NOT NULL,
  codForn            INT           NOT NULL,
  codProd            INT           NOT NULL,
  quantidade         DECIMAL(10,3) NOT NULL,
  valorUnitario      DECIMAL(10,2) NOT NULL,
  descontoPercentual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descontoValor      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorTotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rateioFrete        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rateioSeguro       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rateioOutras       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  custoFinal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quantidadeRecebida DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  PRIMARY KEY (numero, modelo, serie, codForn, codProd),
  CONSTRAINT fk_produto_compra_compra  FOREIGN KEY (numero, modelo, serie, codForn)
    REFERENCES compras (numero, modelo, serie, codForn) ON DELETE CASCADE,
  CONSTRAINT fk_produto_compra_produto FOREIGN KEY (codProd) REFERENCES produtos (codProd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 20. NOTAS DE ENTRADA
--     situacao: PENDENTE | CONFERIDA | CANCELADA
--     pedido*: compra (pedido) vinculada, do mesmo fornecedor (codForn).
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notasEntrada (
  numero             VARCHAR(9)    NOT NULL,
  serie              VARCHAR(3)    NOT NULL,
  modelo             VARCHAR(2)    NOT NULL,
  codForn            INT           NOT NULL,
  dataEmissao        DATE          NOT NULL DEFAULT (CURRENT_DATE),
  dataChegada        DATE          DEFAULT NULL,
  tipoFrete          CHAR(3)       NOT NULL,
  valorProdutos      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorFrete         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorSeguro        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  outrasDespesas     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorDesconto      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorTotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  codCondicao        INT           DEFAULT NULL,
  codTransp          INT           DEFAULT NULL,
  placaVeiculo       VARCHAR(11)   DEFAULT NULL,
  observacoes        TEXT          DEFAULT NULL,
  situacao           VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',
  pedidoNumero       VARCHAR(9)    DEFAULT NULL,
  pedidoSerie        VARCHAR(3)    DEFAULT NULL,
  pedidoModelo       VARCHAR(2)    DEFAULT NULL,
  motivoCancelamento VARCHAR(255)  DEFAULT NULL,
  PRIMARY KEY (numero, modelo, serie, codForn),
  INDEX idx_nota_entrada_pedido (pedidoNumero, pedidoModelo, pedidoSerie, codForn),
  CONSTRAINT fk_nota_entrada_fornecedor     FOREIGN KEY (codForn)     REFERENCES fornecedores (codForn),
  CONSTRAINT fk_nota_entrada_condicao       FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao),
  CONSTRAINT fk_nota_entrada_transportadora FOREIGN KEY (codTransp)   REFERENCES transportadores (codTransp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 21. PRODUTOS DA NOTA DE ENTRADA
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtosNotaEntrada (
  numero             VARCHAR(9)    NOT NULL,
  modelo             VARCHAR(2)    NOT NULL,
  serie              VARCHAR(3)    NOT NULL,
  codForn            INT           NOT NULL,
  codProd            INT           NOT NULL,
  quantidade         INT           NOT NULL,
  valorUnitario      DECIMAL(10,2) NOT NULL,
  valorTotal         DECIMAL(10,2) NOT NULL,
  descontoPercentual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descontoValor      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rateioFrete        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rateioSeguro       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rateioOutras       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  custoFinal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (numero, modelo, serie, codForn, codProd),
  CONSTRAINT fk_itnfe_nota    FOREIGN KEY (numero, modelo, serie, codForn)
    REFERENCES notasEntrada (numero, modelo, serie, codForn) ON DELETE CASCADE,
  CONSTRAINT fk_itnfe_produto FOREIGN KEY (codProd) REFERENCES produtos (codProd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 22. NOTAS DE SAÍDA
--     situacao: PENDENTE | CONFERIDA | CANCELADA
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notasSaida (
  numero             VARCHAR(9)    NOT NULL,
  serie              VARCHAR(3)    NOT NULL,
  modelo             VARCHAR(2)    NOT NULL,
  codCliente         INT           NOT NULL,
  dataEmissao        DATE          NOT NULL DEFAULT (CURRENT_DATE),
  dataSaida          DATE          DEFAULT NULL,
  tipoFrete          CHAR(3)       NOT NULL,
  valorProdutos      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorFrete         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorSeguro        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  outrasDespesas     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorDesconto      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorTotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  codCondicao        INT           DEFAULT NULL,
  codTransp          INT           DEFAULT NULL,
  placaVeiculo       VARCHAR(11)   DEFAULT NULL,
  observacoes        TEXT          DEFAULT NULL,
  situacao           VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',
  motivoCancelamento VARCHAR(255)  DEFAULT NULL,
  PRIMARY KEY (numero, modelo, serie, codCliente),
  CONSTRAINT fk_nota_saida_cliente        FOREIGN KEY (codCliente)  REFERENCES clientes (codCliente),
  CONSTRAINT fk_nota_saida_condicao       FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao),
  CONSTRAINT fk_nota_saida_transportadora FOREIGN KEY (codTransp)   REFERENCES transportadores (codTransp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 23. PRODUTOS DA NOTA DE SAÍDA
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtosNotaSaida (
  numero             VARCHAR(9)    NOT NULL,
  serie              VARCHAR(3)    NOT NULL,
  modelo             VARCHAR(2)    NOT NULL,
  codCliente         INT           NOT NULL,
  codProd            INT           NOT NULL,
  quantidade         INT           NOT NULL,
  valorUnitario      DECIMAL(10,2) NOT NULL,
  valorTotal         DECIMAL(10,2) NOT NULL,
  descontoPercentual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descontoValor      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rateioFrete        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rateioSeguro       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rateioOutras       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  custoFinal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (numero, modelo, serie, codCliente, codProd),
  CONSTRAINT fk_itnfs_nota    FOREIGN KEY (numero, modelo, serie, codCliente)
    REFERENCES notasSaida (numero, modelo, serie, codCliente) ON DELETE CASCADE,
  CONSTRAINT fk_itnfs_produto FOREIGN KEY (codProd) REFERENCES produtos (codProd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 24. NOTAS DE SERVIÇO
--     situacao: PENDENTE | CONFERIDA | CANCELADA
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notasServico (
  numero             VARCHAR(9)    NOT NULL,
  serie              VARCHAR(3)    NOT NULL,
  modelo             VARCHAR(2)    NOT NULL,
  codCliente         INT           NOT NULL,
  dataEmissao        DATE          NOT NULL DEFAULT (CURRENT_DATE),
  valorServicos      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorDesconto      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorTotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  codCondicao        INT           DEFAULT NULL,
  observacoes        TEXT          DEFAULT NULL,
  situacao           VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',
  motivoCancelamento VARCHAR(255)  DEFAULT NULL,
  PRIMARY KEY (numero, modelo, serie, codCliente),
  CONSTRAINT fk_nota_servico_cliente  FOREIGN KEY (codCliente)  REFERENCES clientes (codCliente),
  CONSTRAINT fk_nota_servico_condicao FOREIGN KEY (codCondicao) REFERENCES condicaopagamentos (codCondicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 25. SERVIÇOS DA NOTA DE SERVIÇO
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicosNotaServico (
  numero             VARCHAR(9)    NOT NULL,
  modelo             VARCHAR(2)    NOT NULL,
  serie              VARCHAR(3)    NOT NULL,
  codCliente         INT           NOT NULL,
  codServico         INT           NOT NULL,
  quantidade         INT           NOT NULL,
  valorUnitario      DECIMAL(10,2) NOT NULL,
  valorTotal         DECIMAL(10,2) NOT NULL,
  descontoPercentual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descontoValor      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (numero, modelo, serie, codCliente, codServico),
  CONSTRAINT fk_itnfsv_nota    FOREIGN KEY (numero, modelo, serie, codCliente)
    REFERENCES notasServico (numero, modelo, serie, codCliente) ON DELETE CASCADE,
  CONSTRAINT fk_itnfsv_servico FOREIGN KEY (codServico) REFERENCES servicos (codServico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================================
-- MOVIMENTO DE ESTOQUE (sem codMovimento; identificado pela nota)
-- Um movimento por produto em cada nota conferida.
-- =====================================================================

-- ───────────────────────────────────────────────────────
-- 26. MOVIMENTO DE ENTRADA — chave = nota de entrada + produto
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movimentoEstoqueEntrada (
  numero              VARCHAR(9)    NOT NULL,
  modelo              VARCHAR(2)    NOT NULL,
  serie               VARCHAR(3)    NOT NULL,
  codForn             INT           NOT NULL,
  codProd             INT           NOT NULL,
  quantidade          DECIMAL(12,3) NOT NULL,
  custoUnitario       DECIMAL(12,4) NOT NULL,  -- custo final (com frete, seguro e despesas rateados)
  valorTotal          DECIMAL(12,2) NOT NULL,
  saldoAnterior       DECIMAL(12,3) NOT NULL,
  saldoPosterior      DECIMAL(12,3) NOT NULL,
  custoMedioAnterior  DECIMAL(12,4) NOT NULL,
  custoMedioPosterior DECIMAL(12,4) NOT NULL,
  dataMovimento       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacao          VARCHAR(100)  NULL,
  PRIMARY KEY (numero, modelo, serie, codForn, codProd),
  INDEX idx_movent_produto_data (codProd, dataMovimento),
  CONSTRAINT fk_movent_nota    FOREIGN KEY (numero, modelo, serie, codForn)
    REFERENCES notasEntrada (numero, modelo, serie, codForn),
  CONSTRAINT fk_movent_produto FOREIGN KEY (codProd) REFERENCES produtos (codProd),
  CONSTRAINT chk_movent_quantidade CHECK (quantidade > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 27. MOVIMENTO DE SAÍDA — chave = nota de saída + produto
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movimentoEstoqueSaida (
  numero              VARCHAR(9)    NOT NULL,
  modelo              VARCHAR(2)    NOT NULL,
  serie               VARCHAR(3)    NOT NULL,
  codCliente          INT           NOT NULL,
  codProd             INT           NOT NULL,
  quantidade          DECIMAL(12,3) NOT NULL,
  custoUnitario       DECIMAL(12,4) NOT NULL,  -- custo médio vigente no momento da saída
  valorTotal          DECIMAL(12,2) NOT NULL,
  saldoAnterior       DECIMAL(12,3) NOT NULL,
  saldoPosterior      DECIMAL(12,3) NOT NULL,
  custoMedioAnterior  DECIMAL(12,4) NOT NULL,
  custoMedioPosterior DECIMAL(12,4) NOT NULL,  -- igual ao anterior (saída não altera o custo médio)
  dataMovimento       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observacao          VARCHAR(100)  NULL,
  PRIMARY KEY (numero, modelo, serie, codCliente, codProd),
  INDEX idx_movsai_produto_data (codProd, dataMovimento),
  CONSTRAINT fk_movsai_nota    FOREIGN KEY (numero, modelo, serie, codCliente)
    REFERENCES notasSaida (numero, modelo, serie, codCliente),
  CONSTRAINT fk_movsai_produto FOREIGN KEY (codProd) REFERENCES produtos (codProd),
  CONSTRAINT chk_movsai_quantidade CHECK (quantidade > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 28. VIEW movimentoEstoque — extrato único (entradas + saídas)
-- ───────────────────────────────────────────────────────
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

-- =====================================================================
-- FINANCEIRO
-- Uma linha por parcela; chave = nota + parceiro + número da parcela.
-- =====================================================================

-- ───────────────────────────────────────────────────────
-- 29. CONTAS A PAGAR (geradas ao conferir a nota de entrada)
--     situacao: PENDENTE | PAGA | CANCELADA
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contasPagar (
  notaNumero         VARCHAR(9)    NOT NULL,
  notaModelo         VARCHAR(2)    NOT NULL,
  notaSerie          VARCHAR(3)    NOT NULL,
  codForn            INT           NOT NULL,
  numeroParcela      INT           NOT NULL,
  totalParcelas      INT           NOT NULL,
  valorOriginal      DECIMAL(10,2) NOT NULL,
  valorPago          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorDesconto      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorJuros         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorMulta         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualJuros    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualMulta    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualDesconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorTotal         DECIMAL(10,2) NOT NULL,
  dataEmissao        DATE          NOT NULL,
  dataVencimento     DATE          NOT NULL,
  dataPagamento      DATE          DEFAULT NULL,
  codFormaPagamento  INT           DEFAULT NULL,
  situacao           VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',
  observacoes        TEXT          DEFAULT NULL,
  PRIMARY KEY (notaNumero, notaModelo, notaSerie, codForn, numeroParcela),
  INDEX idx_contas_pagar_vencimento (dataVencimento),
  CONSTRAINT fk_contas_pagar_nota        FOREIGN KEY (notaNumero, notaModelo, notaSerie, codForn)
    REFERENCES notasEntrada (numero, modelo, serie, codForn) ON DELETE CASCADE,
  CONSTRAINT fk_contas_pagar_fornecedor  FOREIGN KEY (codForn)           REFERENCES fornecedores (codForn),
  CONSTRAINT fk_contas_pagar_forma_pagto FOREIGN KEY (codFormaPagamento) REFERENCES formapagamentos (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 30. CONTAS A PAGAR AVULSAS (sem nota de entrada no sistema)
--     situacao: PENDENTE | PAGA | CANCELADA
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contasPagarAvulsa (
  notaNumero         VARCHAR(9)    NOT NULL,
  notaModelo         VARCHAR(2)    NOT NULL,
  notaSerie          VARCHAR(3)    NOT NULL,
  codForn            INT           NOT NULL,
  numeroParcela      INT           NOT NULL,
  totalParcelas      INT           NOT NULL,
  valorOriginal      DECIMAL(10,2) NOT NULL,
  valorPago          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorDesconto      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorJuros         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorMulta         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualJuros    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualMulta    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualDesconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorTotal         DECIMAL(10,2) NOT NULL,
  codCondicao        INT           DEFAULT NULL,
  dataEmissao        DATE          NOT NULL,
  dataVencimento     DATE          NOT NULL,
  dataPagamento      DATE          DEFAULT NULL,
  codFormaPagamento  INT           DEFAULT NULL,
  situacao           VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',
  observacoes        TEXT          DEFAULT NULL,
  PRIMARY KEY (notaNumero, notaModelo, notaSerie, codForn, numeroParcela),
  INDEX idx_contas_pagar_avulsa_vencimento (dataVencimento),
  CONSTRAINT fk_contas_pagar_avulsa_fornecedor  FOREIGN KEY (codForn)           REFERENCES fornecedores (codForn),
  CONSTRAINT fk_contas_pagar_avulsa_condicao    FOREIGN KEY (codCondicao)       REFERENCES condicaopagamentos (codCondicao),
  CONSTRAINT fk_contas_pagar_avulsa_forma_pagto FOREIGN KEY (codFormaPagamento) REFERENCES formapagamentos (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 31. CONTAS A RECEBER (geradas ao conferir a nota de saída)
--     situacao: PENDENTE | RECEBIDO | CANCELADA
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contasReceber (
  notaNumero         VARCHAR(9)    NOT NULL,
  notaModelo         VARCHAR(2)    NOT NULL,
  notaSerie          VARCHAR(3)    NOT NULL,
  codCliente         INT           NOT NULL,
  numeroParcela      INT           NOT NULL,
  totalParcelas      INT           NOT NULL,
  valorOriginal      DECIMAL(10,2) NOT NULL,
  valorRecebido      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorDesconto      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorJuros         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorMulta         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualJuros    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualMulta    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualDesconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorTotal         DECIMAL(10,2) NOT NULL,
  dataEmissao        DATE          NOT NULL DEFAULT (CURRENT_DATE),
  dataVencimento     DATE          NOT NULL,
  dataRecebimento    DATE          DEFAULT NULL,
  codFormaPagamento  INT           DEFAULT NULL,
  situacao           VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',
  observacoes        TEXT          DEFAULT NULL,
  PRIMARY KEY (notaNumero, notaModelo, notaSerie, codCliente, numeroParcela),
  INDEX idx_contas_receber_vencimento (dataVencimento),
  CONSTRAINT fk_contas_receber_nota        FOREIGN KEY (notaNumero, notaModelo, notaSerie, codCliente)
    REFERENCES notasSaida (numero, modelo, serie, codCliente) ON DELETE CASCADE,
  CONSTRAINT fk_contas_receber_cliente     FOREIGN KEY (codCliente)        REFERENCES clientes (codCliente),
  CONSTRAINT fk_contas_receber_forma_pagto FOREIGN KEY (codFormaPagamento) REFERENCES formapagamentos (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 32. CONTAS A RECEBER DE SERVIÇO (geradas ao conferir a nota de serviço)
--     situacao: PENDENTE | RECEBIDO | CANCELADA
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contasReceberServico (
  notaNumero         VARCHAR(9)    NOT NULL,
  notaModelo         VARCHAR(2)    NOT NULL,
  notaSerie          VARCHAR(3)    NOT NULL,
  codCliente         INT           NOT NULL,
  numeroParcela      INT           NOT NULL,
  totalParcelas      INT           NOT NULL,
  valorOriginal      DECIMAL(10,2) NOT NULL,
  valorRecebido      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorDesconto      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorJuros         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorMulta         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualJuros    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualMulta    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  percentualDesconto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  valorTotal         DECIMAL(10,2) NOT NULL,
  dataEmissao        DATE          NOT NULL DEFAULT (CURRENT_DATE),
  dataVencimento     DATE          NOT NULL,
  dataRecebimento    DATE          DEFAULT NULL,
  codFormaPagamento  INT           DEFAULT NULL,
  situacao           VARCHAR(20)   NOT NULL DEFAULT 'PENDENTE',
  observacoes        TEXT          DEFAULT NULL,
  PRIMARY KEY (notaNumero, notaModelo, notaSerie, codCliente, numeroParcela),
  INDEX idx_contas_receber_servico_vencimento (dataVencimento),
  CONSTRAINT fk_contas_receber_servico_nota        FOREIGN KEY (notaNumero, notaModelo, notaSerie, codCliente)
    REFERENCES notasServico (numero, modelo, serie, codCliente) ON DELETE CASCADE,
  CONSTRAINT fk_contas_receber_servico_cliente     FOREIGN KEY (codCliente)        REFERENCES clientes (codCliente),
  CONSTRAINT fk_contas_receber_servico_forma_pagto FOREIGN KEY (codFormaPagamento) REFERENCES formapagamentos (codFormaPagamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────────────────────────────────────────────────
-- 33. LOGS (LogRepository.AddAsync)
--     Descricao em TEXT: as descrições de edição listam todas as mudanças
--     e podem passar de 255 caracteres.
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logs (
  CodLog    INT         NOT NULL AUTO_INCREMENT,
  Entidade  VARCHAR(30) NOT NULL,
  Acao      VARCHAR(20) NOT NULL,
  Descricao TEXT        NOT NULL,
  CriadoEm  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (CodLog),
  INDEX idx_logs_criado_em (CriadoEm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
