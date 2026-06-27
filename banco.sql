-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: devsis
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `codCategoria` int NOT NULL AUTO_INCREMENT,
  `categoria` varchar(20) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`codCategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Bebidas',1);
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cidades`
--

DROP TABLE IF EXISTS `cidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cidades` (
  `codCidade` int NOT NULL AUTO_INCREMENT,
  `cidade` varchar(40) DEFAULT NULL,
  `ddd` varchar(4) DEFAULT NULL,
  `codEstado` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codCidade`),
  KEY `codEs` (`codEstado`),
  CONSTRAINT `cidades_ibfk_1` FOREIGN KEY (`codEstado`) REFERENCES `estados` (`codEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cidades`
--

LOCK TABLES `cidades` WRITE;
/*!40000 ALTER TABLE `cidades` DISABLE KEYS */;
INSERT INTO `cidades` VALUES (3,'Foz do Iguaçu','(45)',1,1),(4,'Rio de Janeiro',NULL,2,0);
/*!40000 ALTER TABLE `cidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `codCliente` int NOT NULL AUTO_INCREMENT,
  `cliente` varchar(50) NOT NULL,
  `apelido` varchar(50) NOT NULL,
  `endereco` varchar(50) DEFAULT NULL,
  `bairro` varchar(25) DEFAULT NULL,
  `numero` int DEFAULT NULL,
  `complemento` varchar(25) DEFAULT NULL,
  `cep` varchar(8) DEFAULT NULL,
  `codCidade` int DEFAULT NULL,
  `fone` varchar(15) DEFAULT NULL,
  `email` varchar(30) DEFAULT NULL,
  `codCondicao` int DEFAULT NULL,
  `cpfcnpj` varchar(14) DEFAULT NULL,
  `RgInscEst` varchar(13) DEFAULT NULL,
  `tipoPessoa` char(2) NOT NULL DEFAULT 'PF',
  `dataNascimento` date DEFAULT NULL,
  `sexo` char(1) DEFAULT NULL,
  `limiteCredito` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codCliente`),
  KEY `fk_cliente_cidade` (`codCidade`),
  KEY `fk_cliente_condicao` (`codCondicao`),
  CONSTRAINT `fk_cliente_cidade` FOREIGN KEY (`codCidade`) REFERENCES `cidades` (`codCidade`),
  CONSTRAINT `fk_cliente_condicao` FOREIGN KEY (`codCondicao`) REFERENCES `condicaopagamentos` (`codCondicao`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'CLIENTE NOVO','ALEMAO','RUA DOS CLIENTESS','CETRO',999,'EM FRENTE A CRECHE','23652214',4,'452211698875','EMAIL@CLIENTE,COM',4,'44512398759','7784452365','F','1989-08-22','F',5000,1);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `condicaopagamentos`
--

DROP TABLE IF EXISTS `condicaopagamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `condicaopagamentos` (
  `codCondicao` int NOT NULL AUTO_INCREMENT,
  `condicaoPagamento` varchar(10) NOT NULL,
  `numeroParcelas` int DEFAULT NULL,
  `percentualJuros` decimal(10,2) DEFAULT '0.00',
  `percentualMultas` decimal(10,2) DEFAULT '0.00',
  `percentualDesconto` decimal(10,2) DEFAULT '0.00',
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codCondicao`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `condicaopagamentos`
--

LOCK TABLES `condicaopagamentos` WRITE;
/*!40000 ALTER TABLE `condicaopagamentos` DISABLE KEYS */;
INSERT INTO `condicaopagamentos` VALUES (1,'parcelado',0,0.00,0.08,0.13,1),(3,'testee',4,0.06,0.18,0.15,1),(4,'SUPERTESTE',5,0.27,0.35,0.01,1);
/*!40000 ALTER TABLE `condicaopagamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contaspagar`
--

DROP TABLE IF EXISTS `contaspagar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contaspagar` (
  `numero` int NOT NULL,
  `serie` int NOT NULL,
  `modelo` int NOT NULL,
  `codForn` int NOT NULL,
  `numeroParcela` int NOT NULL,
  `valorParcela` decimal(12,2) DEFAULT NULL,
  `vencimentoParcela` date DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`numero`,`serie`,`modelo`,`codForn`,`numeroParcela`),
  KEY `codForn` (`codForn`),
  CONSTRAINT `contaspagar_ibfk_1` FOREIGN KEY (`numero`, `serie`, `modelo`) REFERENCES `nfes` (`numero`, `serie`, `modelo`),
  CONSTRAINT `contaspagar_ibfk_2` FOREIGN KEY (`codForn`) REFERENCES `fornecedores` (`codForn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contaspagar`
--

LOCK TABLES `contaspagar` WRITE;
/*!40000 ALTER TABLE `contaspagar` DISABLE KEYS */;
INSERT INTO `contaspagar` VALUES (94814,1,1,1,2,250.00,'2026-04-17',1),(94814,1,1,1,8,5086.78,'2026-06-30',1);
/*!40000 ALTER TABLE `contaspagar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estados`
--

DROP TABLE IF EXISTS `estados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estados` (
  `codEstado` int NOT NULL AUTO_INCREMENT,
  `estado` varchar(20) DEFAULT NULL,
  `UF` char(2) DEFAULT NULL,
  `codPais` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codEstado`),
  KEY `codPais` (`codPais`),
  CONSTRAINT `estados_ibfk_1` FOREIGN KEY (`codPais`) REFERENCES `paises` (`codPais`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estados`
--

LOCK TABLES `estados` WRITE;
/*!40000 ALTER TABLE `estados` DISABLE KEYS */;
INSERT INTO `estados` VALUES (1,'Paraná','PR',1,1),(2,'Rio de Janeiro','RJ',1,1);
/*!40000 ALTER TABLE `estados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formapagamentos`
--

DROP TABLE IF EXISTS `formapagamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formapagamentos` (
  `codFormaPagamento` int NOT NULL AUTO_INCREMENT,
  `formaPagamento` varchar(20) NOT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codFormaPagamento`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formapagamentos`
--

LOCK TABLES `formapagamentos` WRITE;
/*!40000 ALTER TABLE `formapagamentos` DISABLE KEYS */;
INSERT INTO `formapagamentos` VALUES (1,'Dinheiro ',1),(2,'Pix',1);
/*!40000 ALTER TABLE `formapagamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fornecedores`
--

DROP TABLE IF EXISTS `fornecedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fornecedores` (
  `codForn` int NOT NULL AUTO_INCREMENT,
  `fornecedor` varchar(50) DEFAULT NULL,
  `nomeFantasia` varchar(50) DEFAULT NULL,
  `endereco` varchar(50) DEFAULT NULL,
  `bairro` varchar(25) DEFAULT NULL,
  `numero` int DEFAULT NULL,
  `complemento` varchar(25) DEFAULT NULL,
  `cep` varchar(8) DEFAULT NULL,
  `fone` varchar(15) DEFAULT NULL,
  `email` varchar(30) DEFAULT NULL,
  `site` varchar(50) DEFAULT NULL,
  `RgInscEst` varchar(13) DEFAULT NULL,
  `InscEstSubTrib` varchar(13) DEFAULT NULL,
  `cpfcnpj` varchar(14) DEFAULT NULL,
  `tipoPessoa` char(2) NOT NULL DEFAULT 'PJ',
  `codCidade` int DEFAULT NULL,
  `codCondicao` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codForn`),
  KEY `codCidade` (`codCidade`),
  KEY `fk_forn_condicao` (`codCondicao`),
  CONSTRAINT `fk_forn_condicao` FOREIGN KEY (`codCondicao`) REFERENCES `condicaopagamentos` (`codCondicao`),
  CONSTRAINT `fornecedores_ibfk_1` FOREIGN KEY (`codCidade`) REFERENCES `cidades` (`codCidade`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fornecedores`
--

LOCK TABLES `fornecedores` WRITE;
/*!40000 ALTER TABLE `fornecedores` DISABLE KEYS */;
INSERT INTO `fornecedores` VALUES (1,'Fornecedor de batatas','batateiro','Rua das batatas n474','Centro',0,'perto da loja de roupas','85857726','(45) 99685471','batatas@email.com','sitedasbatatas.com','6775111761',NULL,'27710127000150','PJ',4,1,1);
/*!40000 ALTER TABLE `fornecedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcionarios`
--

DROP TABLE IF EXISTS `funcionarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funcionarios` (
  `codFunc` int NOT NULL AUTO_INCREMENT,
  `funcionario` varchar(50) NOT NULL,
  `apelido` varchar(50) NOT NULL,
  `endereco` varchar(50) DEFAULT NULL,
  `bairro` varchar(25) DEFAULT NULL,
  `numero` int DEFAULT NULL,
  `complemento` varchar(25) DEFAULT NULL,
  `cep` varchar(8) DEFAULT NULL,
  `codCidade` int DEFAULT NULL,
  `fone` varchar(15) DEFAULT NULL,
  `email` varchar(30) DEFAULT NULL,
  `cpfcnpj` varchar(14) DEFAULT NULL,
  `RgInscEst` varchar(13) DEFAULT NULL,
  `tipoPessoa` char(2) NOT NULL DEFAULT 'PF',
  `dataNascimento` date DEFAULT NULL,
  `sexo` char(1) DEFAULT NULL,
  `dataAdmissao` date NOT NULL,
  `dataDemissao` date DEFAULT NULL,
  `salario` decimal(10,2) NOT NULL,
  `codFuncao` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codFunc`),
  KEY `fk_func_cidade` (`codCidade`),
  KEY `fk_func_funcao` (`codFuncao`),
  CONSTRAINT `fk_func_cidade` FOREIGN KEY (`codCidade`) REFERENCES `cidades` (`codCidade`),
  CONSTRAINT `fk_func_funcao` FOREIGN KEY (`codFuncao`) REFERENCES `funcoes` (`codFuncao`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcionarios`
--

LOCK TABLES `funcionarios` WRITE;
/*!40000 ALTER TABLE `funcionarios` DISABLE KEYS */;
INSERT INTO `funcionarios` VALUES (1,'Novo Funcionario','careca','RUA DOS FUNCIONARIOS','CENTRO',566,'APTO 405','21013365',4,'45 996554471','email@FUNCIONARIO.COM','45298761865','221365907','F','2000-05-23','M','2026-06-19',NULL,4000.00,1,1);
/*!40000 ALTER TABLE `funcionarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcoes`
--

DROP TABLE IF EXISTS `funcoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funcoes` (
  `codFuncao` int NOT NULL AUTO_INCREMENT,
  `funcao` varchar(20) NOT NULL,
  `salarioBase` decimal(10,2) NOT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codFuncao`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcoes`
--

LOCK TABLES `funcoes` WRITE;
/*!40000 ALTER TABLE `funcoes` DISABLE KEYS */;
INSERT INTO `funcoes` VALUES (1,'Testador',20000.00,1);
/*!40000 ALTER TABLE `funcoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `CodLog` int NOT NULL AUTO_INCREMENT,
  `Entidade` varchar(20) NOT NULL,
  `Acao` varchar(20) NOT NULL,
  `Descricao` varchar(255) NOT NULL,
  `CriadoEm` datetime NOT NULL,
  PRIMARY KEY (`CodLog`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs`
--

LOCK TABLES `logs` WRITE;
/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
INSERT INTO `logs` VALUES (1,'Países','CRIOU','Criou País: Estados Unidos da America','2026-05-30 14:09:33'),(2,'Países','EDITOU','Editou País: Estados Unidos da America','2026-05-30 14:15:51'),(3,'Fornecedores','EDITOU','Editou Fornecedor: Fornecedor de batatas','2026-06-03 14:44:38'),(4,'Transportadores','CRIOU','Criou Transportador: Transportador Fisico','2026-06-03 15:02:53'),(5,'CondicaoPagamentos','CRIOU','Criou Condição: parcelado','2026-06-09 17:10:02'),(6,'CondicaoPagamentos','CRIOU','Criou Condição: testando','2026-06-09 21:03:39'),(7,'CondicaoPagamentos','EDITOU','Editou Condição: testando','2026-06-09 21:04:46'),(8,'CondicaoPagamentos','EXCLUIU','Excluiu Condição: testando','2026-06-09 21:06:24'),(9,'CondicaoPagamentos','CRIOU','Criou Condição: testee','2026-06-09 21:07:08'),(10,'Países','EDITOU','Editou País: França. Moeda: EUR (Era Euro)','2026-06-13 14:08:15'),(11,'Estados','EDITOU','Editou Estado: Rio de Janeiro (RJ)','2026-06-13 14:13:17'),(12,'Estados','EDITOU','Editou Estado: Rio de Janeiro (RJ)','2026-06-13 14:13:58'),(13,'Estados','EDITOU','Editou Estado: Rio de Janeiro (RJ)','2026-06-13 14:15:37'),(14,'Estados','EDITOU','Editou Estado: Rio de Janeiro (RJ). País: 7 (Era 1)','2026-06-13 14:19:19'),(15,'Estados','EDITOU','Editou Estado: Rio de Janeiro (RJ). País: 6 (Era 7)','2026-06-13 14:21:08'),(16,'Estados','EDITOU','Editou Estado: Rio de Janeiro (RJ). País: 7 (Era 6). Ativo: Não (Era Sim)','2026-06-13 14:23:22'),(17,'Estados','EDITOU','Editou Estado: Rio de Janeiro (RJ). País: 1 (Era 7). Ativo: Sim (Era Não)','2026-06-13 14:23:58'),(18,'Estados','EDITOU','Editou Estado: Rio de Janeiro (RJ). País: Libano (Era Brasil)','2026-06-13 14:25:14'),(19,'Cidades','EDITOU','Editou Cidade: Rio de Janeiro','2026-06-13 14:34:49'),(20,'Estados','EDITOU','Editou Estado: Rio de Janeiro (RJ). País: Brasil (Era Libano)','2026-06-13 14:35:28'),(21,'Cidades','EDITOU','Editou Cidade: Rio de Janeiro','2026-06-13 14:35:34'),(22,'Cidades','EDITOU','Editou Cidade: Rio de Janeiro','2026-06-13 14:37:35'),(23,'Cidades','EDITOU','Editou Cidade: Rio de Janeiro','2026-06-13 14:41:55'),(24,'Cidades','EDITOU','Editou Cidade: Rio de Janeiro','2026-06-13 14:46:37'),(25,'Cidades','EDITOU','Editou Cidade: Rio de Janeiro. Estado: Paraná (Era Rio de Janeiro)','2026-06-13 14:47:10'),(26,'Cidades','EDITOU','Editou Cidade: Rio de Janeiro. Estado: Rio de Janeiro (Era Paraná)','2026-06-13 14:47:27'),(27,'Fornecedores','EDITOU','Editou Fornecedor: Fornecedor de batatas. Cidade: Rio de Janeiro (Era Foz do Iguaçu)','2026-06-13 14:52:36'),(28,'Marcas','CRIOU','Criou Marca: Mercedes-Benz','2026-06-18 16:01:03'),(29,'Categorias','CRIOU','Criou Categoria: Bebidas','2026-06-18 16:09:22'),(30,'Funcoes','CRIOU','Criou Função: Testador','2026-06-18 16:40:12'),(31,'Funcoes','EDITOU','Editou Função: Testador. Salário Base: $20,000.00 (Era $20.89)','2026-06-18 16:40:30'),(32,'CondicaoPagamentos','CRIOU','Criou Condição: SUPERTESTE','2026-06-18 16:43:40'),(33,'Veículos','EDITOU','Editou Veículo: . Modelo: A 250 (Era ). Marca: Mercedes-Benz (Era )','2026-06-19 14:55:07'),(34,'Funcionarios','CRIOU','Criou Funcionário: Novo Funcionario','2026-06-19 16:09:26'),(35,'Clientes','CRIOU','Criou Cliente: CLIENTE NOVO','2026-06-19 16:16:42'),(36,'Funcionarios','CRIOU','Criou Funcionário: aa','2026-06-19 16:41:21'),(37,'Funcionarios','EDITOU','Editou Funcionário: Novo Funcionario','2026-06-19 16:56:45'),(38,'Funcionarios','EXCLUIU','Excluiu Funcionário: aa','2026-06-19 16:56:59'),(39,'Funcionarios','EDITOU','Editou Funcionário: Novo Funcionario. Nascimento: 5/23/2000 (Era 5/22/2000)','2026-06-19 17:13:48'),(40,'Funcionarios','EDITOU','Editou Funcionário: Novo Funcionario','2026-06-19 17:17:24'),(41,'Funcionarios','EDITOU','Editou Funcionário: Novo Funcionario','2026-06-19 17:18:10'),(42,'Funcionarios','EDITOU','Editou Funcionário: Novo Funcionario','2026-06-19 17:18:35'),(43,'Funcionarios','EDITOU','Editou Funcionário: Novo Funcionario','2026-06-19 17:20:13'),(44,'Funcionarios','EDITOU','Editou Funcionário: Novo Funcionario. Demissão:  (Era 1/1/0001)','2026-06-19 17:37:22'),(45,'Clientes','EDITOU','Editou Cliente: CLIENTE NOVO. Nascimento: 8/4/2004 (Era 6/23/1898). Cidade: Rio de Janeiro (Era Foz do Iguaçu)','2026-06-19 17:38:42'),(46,'Clientes','EDITOU','Editou Cliente: CLIENTE NOVO. Nascimento: 8/22/1989 (Era 8/4/2004)','2026-06-19 17:41:40'),(47,'Fornecedores','EDITOU','Editou Fornecedor: Fornecedor de batatas','2026-06-19 17:45:50'),(48,'Produtos','EDITOU','Editou Produto: teys. Categoria: 1 (Era 0). Marca: 1 (Era 0)','2026-06-19 17:46:18'),(49,'Produtos','EDITOU','Editou Produto: teys','2026-06-19 17:47:19'),(50,'Países','EDITOU','Editou País: Brasil. Sigla: BRq (Era BR)','2026-06-23 14:36:44'),(51,'Países','EDITOU','Editou País: Brasil. Sigla: BR (Era BRq)','2026-06-23 14:37:36'),(52,'Cidades','EDITOU','Editou Cidade: Foz do Iguaçu. DDD: \'(45) (Era )\'','2026-06-23 14:41:03'),(53,'Fornecedores','EDITOU','Editou Fornecedor: Fornecedor de batatas. Complemento: perto da loja de roupas (Era )','2026-06-23 14:45:18'),(54,'Clientes','EDITOU','Editou Cliente: CLIENTE NOVO. Endereço: RUA DOS CLIENTESS (Era RUA DOS CLIENTES)','2026-06-23 14:46:12'),(55,'Transportadores','EDITOU','Editou Transportador: Transportador Fisico','2026-06-23 14:48:34'),(56,'Marcas','CRIOU','Criou Marca: Honda','2026-06-23 14:48:57'),(57,'Veículos','EDITOU','Editou Veículo: ETO 7383. Modelo: Civic G10 (Era ). Marca: Honda (Era )','2026-06-23 14:49:16'),(58,'Transportadores','EDITOU','Editou Transportador: Transportador Fisico. RG/Insc. Est.: 7898474 (Era 569328471)','2026-06-23 14:49:37'),(59,'Transportadores','EDITOU','Editou Transportador: Transportador Fisico. Número: 55 (Era 0)','2026-06-23 14:50:17'),(60,'Produtos','EDITOU','Editou Produto: teys','2026-06-23 16:51:09'),(61,'Produtos','EDITOU','Editou Produto: teys. Marca: 2 (Era 1)','2026-06-23 16:51:17'),(62,'Funcionarios','EDITOU','Editou Funcionário: Novo Funcionario. Tipo Pessoa: F (Era PF)','2026-06-26 17:07:41');
/*!40000 ALTER TABLE `logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marcas`
--

DROP TABLE IF EXISTS `marcas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marcas` (
  `codMarca` int NOT NULL AUTO_INCREMENT,
  `marca` varchar(20) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`codMarca`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marcas`
--

LOCK TABLES `marcas` WRITE;
/*!40000 ALTER TABLE `marcas` DISABLE KEYS */;
INSERT INTO `marcas` VALUES (1,'Mercedes-Benz',1),(2,'Honda',1);
/*!40000 ALTER TABLE `marcas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ncmshs`
--

DROP TABLE IF EXISTS `ncmshs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ncmshs` (
  `ncmSh` varchar(10) NOT NULL,
  `aliqIcms` decimal(10,2) DEFAULT NULL,
  `aliqIpi` decimal(10,2) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`ncmSh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ncmshs`
--

LOCK TABLES `ncmshs` WRITE;
/*!40000 ALTER TABLE `ncmshs` DISABLE KEYS */;
INSERT INTO `ncmshs` VALUES ('19022000',0.22,0.17,1);
/*!40000 ALTER TABLE `ncmshs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nfes`
--

DROP TABLE IF EXISTS `nfes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nfes` (
  `numero` int NOT NULL,
  `serie` int NOT NULL,
  `modelo` int NOT NULL,
  `codForn` int DEFAULT NULL,
  `pagina` int DEFAULT NULL,
  `natOper` varchar(50) DEFAULT NULL,
  `protAcesso` varchar(15) DEFAULT NULL,
  `dataProtAcesso` date DEFAULT NULL,
  `horaProtAcesso` time DEFAULT NULL,
  `chaveAcesso` varchar(44) DEFAULT NULL,
  `dataEmit` date DEFAULT NULL,
  `dataEnt` date DEFAULT NULL,
  `horaEnt` time DEFAULT NULL,
  `baseCalcIcms` decimal(12,2) DEFAULT NULL,
  `valorIcms` decimal(12,2) DEFAULT NULL,
  `baseCalcIcmsSub` decimal(12,2) DEFAULT NULL,
  `valorIcmsSub` decimal(12,2) DEFAULT NULL,
  `valorFrete` decimal(12,2) DEFAULT NULL,
  `valorSeguro` decimal(12,2) DEFAULT NULL,
  `desconto` decimal(12,2) DEFAULT NULL,
  `outrasDesp` decimal(12,2) DEFAULT NULL,
  `valorIpi` decimal(12,2) DEFAULT NULL,
  `codTransp` int DEFAULT NULL,
  `fretePorConta` varchar(20) DEFAULT NULL,
  `codVeic` int DEFAULT NULL,
  `quantidade` int DEFAULT NULL,
  `especie` varchar(15) DEFAULT NULL,
  `marca` varchar(20) DEFAULT NULL,
  `pesoBruto` decimal(10,2) DEFAULT NULL,
  `pesoLiq` decimal(10,2) DEFAULT NULL,
  `infComp` text,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`numero`,`serie`,`modelo`),
  KEY `codForn` (`codForn`),
  KEY `codTransp` (`codTransp`),
  KEY `codVeic` (`codVeic`),
  CONSTRAINT `nfes_ibfk_1` FOREIGN KEY (`codForn`) REFERENCES `fornecedores` (`codForn`),
  CONSTRAINT `nfes_ibfk_2` FOREIGN KEY (`codTransp`) REFERENCES `transportadores` (`codTransp`),
  CONSTRAINT `nfes_ibfk_3` FOREIGN KEY (`codVeic`) REFERENCES `veiculos` (`codVeic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nfes`
--

LOCK TABLES `nfes` WRITE;
/*!40000 ALTER TABLE `nfes` DISABLE KEYS */;
INSERT INTO `nfes` VALUES (94814,1,1,1,1,'teste','185484','2026-04-03','16:40:00','94984118949814','2026-04-03','2026-04-03','16:40:00',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,1,'0',1,1,'especie','marca',150.00,150.00,'testando',1);
/*!40000 ALTER TABLE `nfes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paises`
--

DROP TABLE IF EXISTS `paises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paises` (
  `codPais` int NOT NULL AUTO_INCREMENT,
  `Pais` varchar(55) DEFAULT NULL,
  `sigla` char(3) DEFAULT NULL,
  `DDI` varchar(5) DEFAULT NULL,
  `moeda` varchar(5) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codPais`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paises`
--

LOCK TABLES `paises` WRITE;
/*!40000 ALTER TABLE `paises` DISABLE KEYS */;
INSERT INTO `paises` VALUES (1,'Brasil','BR','+55','R$',1),(2,'Paraguai','PY','+595','G$',1),(3,'Libano','LB','+961','LL',1),(5,'Argentina','ARG','+54','P$',1),(6,'França','FRA','+33','EUR',0),(7,'Estados Unidos da America','EUA','+1','U$D',1);
/*!40000 ALTER TABLE `paises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parcelas`
--

DROP TABLE IF EXISTS `parcelas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parcelas` (
  `codCondicao` int NOT NULL,
  `numeroParcela` int NOT NULL,
  `percentual` decimal(5,2) NOT NULL,
  `dias` int NOT NULL,
  `codFormaPagamento` int DEFAULT NULL,
  PRIMARY KEY (`codCondicao`,`numeroParcela`),
  KEY `codFormaPagamento` (`codFormaPagamento`),
  CONSTRAINT `parcelas_ibfk_1` FOREIGN KEY (`codCondicao`) REFERENCES `condicaopagamentos` (`codCondicao`),
  CONSTRAINT `parcelas_ibfk_2` FOREIGN KEY (`codFormaPagamento`) REFERENCES `formapagamentos` (`codFormaPagamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parcelas`
--

LOCK TABLES `parcelas` WRITE;
/*!40000 ALTER TABLE `parcelas` DISABLE KEYS */;
INSERT INTO `parcelas` VALUES (3,1,25.00,30,1),(3,2,25.00,60,1),(3,3,25.00,90,2),(3,4,25.00,120,1),(4,1,10.00,30,1),(4,2,10.00,60,1),(4,3,10.00,90,1),(4,4,30.00,120,1),(4,5,40.00,150,2);
/*!40000 ALTER TABLE `parcelas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prodnfes`
--

DROP TABLE IF EXISTS `prodnfes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prodnfes` (
  `numero` int NOT NULL,
  `serie` int NOT NULL,
  `modelo` int NOT NULL,
  `codProd` int NOT NULL,
  `CSOSN` varchar(10) DEFAULT NULL,
  `CFOP` varchar(10) DEFAULT NULL,
  `quantidade` decimal(10,2) DEFAULT NULL,
  `valorUnitario` decimal(12,2) DEFAULT NULL,
  `desconto` decimal(12,2) DEFAULT NULL,
  `valorIcms` decimal(12,2) DEFAULT NULL,
  `valorIpi` decimal(12,2) DEFAULT NULL,
  `aliqIcms` decimal(10,2) DEFAULT NULL,
  `aliqIpi` decimal(10,2) DEFAULT NULL,
  `BaseCalcIcms` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`numero`,`serie`,`modelo`,`codProd`),
  KEY `codProd` (`codProd`),
  CONSTRAINT `prodnfes_ibfk_1` FOREIGN KEY (`numero`, `serie`, `modelo`) REFERENCES `nfes` (`numero`, `serie`, `modelo`),
  CONSTRAINT `prodnfes_ibfk_2` FOREIGN KEY (`codProd`) REFERENCES `produtos` (`codProd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prodnfes`
--

LOCK TABLES `prodnfes` WRITE;
/*!40000 ALTER TABLE `prodnfes` DISABLE KEYS */;
/*!40000 ALTER TABLE `prodnfes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `codProd` int NOT NULL AUTO_INCREMENT,
  `produto` varchar(25) DEFAULT NULL,
  `unidade` varchar(4) DEFAULT NULL,
  `ncmSh` varchar(10) DEFAULT NULL,
  `pesoBruto` decimal(10,2) DEFAULT NULL,
  `pesoLiq` decimal(10,2) DEFAULT NULL,
  `saldo` decimal(10,2) DEFAULT NULL,
  `precoCompra` decimal(10,2) DEFAULT '0.00',
  `precoVenda` decimal(10,2) DEFAULT '0.00',
  `custoMedio` decimal(10,2) DEFAULT NULL,
  `codCategoria` int DEFAULT NULL,
  `codMarca` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codProd`),
  KEY `NCMSHPROD` (`ncmSh`),
  KEY `fk_prod_categoria` (`codCategoria`),
  KEY `fk_prod_marca` (`codMarca`),
  CONSTRAINT `fk_prod_categoria` FOREIGN KEY (`codCategoria`) REFERENCES `categorias` (`codCategoria`),
  CONSTRAINT `fk_prod_marca` FOREIGN KEY (`codMarca`) REFERENCES `marcas` (`codMarca`),
  CONSTRAINT `produtos_ibfk_1` FOREIGN KEY (`ncmSh`) REFERENCES `ncmshs` (`ncmSh`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES (1,'Batata','KG','19022000',500.00,500.00,0.00,0.00,0.00,12.00,NULL,NULL,1),(2,'teys','da','19022000',77.00,444.00,145.00,0.00,0.00,88.00,1,2,1);
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transportadores`
--

DROP TABLE IF EXISTS `transportadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transportadores` (
  `codTransp` int NOT NULL AUTO_INCREMENT,
  `transportador` varchar(50) DEFAULT NULL,
  `nomeFantasia` varchar(100) DEFAULT NULL,
  `endereco` varchar(50) DEFAULT NULL,
  `bairro` varchar(50) DEFAULT NULL,
  `numero` int DEFAULT NULL,
  `complemento` varchar(25) DEFAULT NULL,
  `cep` varchar(8) DEFAULT NULL,
  `fone` varchar(15) DEFAULT NULL,
  `email` varchar(30) DEFAULT NULL,
  `site` varchar(50) DEFAULT NULL,
  `RgInscEst` varchar(14) DEFAULT NULL,
  `CpfCnpj` varchar(13) DEFAULT NULL,
  `tipoPessoa` char(2) NOT NULL DEFAULT 'PJ',
  `codCidade` int DEFAULT NULL,
  `codVeic` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codTransp`),
  KEY `codCidade` (`codCidade`),
  KEY `fk_transp_veic` (`codVeic`),
  CONSTRAINT `fk_transp_veic` FOREIGN KEY (`codVeic`) REFERENCES `veiculos` (`codVeic`),
  CONSTRAINT `transportadores_ibfk_1` FOREIGN KEY (`codCidade`) REFERENCES `cidades` (`codCidade`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transportadores`
--

LOCK TABLES `transportadores` WRITE;
/*!40000 ALTER TABLE `transportadores` DISABLE KEYS */;
INSERT INTO `transportadores` VALUES (1,'Transporte de batatas',NULL,'Rua das batatas n225',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'465184231','78952148763','PJ',3,NULL,1),(2,'Transportador Fisico','Transportinho','Rua doce de Leite','jardim europa',55,'apartamento 701','45896632','995572236','fisicotransp@email.com','www.transpfisico.com','7898474','15355952054','PF',4,1,1);
/*!40000 ALTER TABLE `transportadores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `veiculos`
--

DROP TABLE IF EXISTS `veiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `veiculos` (
  `codVeic` int NOT NULL AUTO_INCREMENT,
  `placaVeic` varchar(11) DEFAULT NULL,
  `placaMercoSul` varchar(7) DEFAULT NULL,
  `modelo` varchar(20) DEFAULT NULL,
  `codANTT` varchar(8) DEFAULT NULL,
  `codEstado` int DEFAULT NULL,
  `codMarca` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codVeic`),
  KEY `codEstado` (`codEstado`),
  KEY `fk_veic_marca` (`codMarca`),
  CONSTRAINT `fk_veic_marca` FOREIGN KEY (`codMarca`) REFERENCES `marcas` (`codMarca`),
  CONSTRAINT `veiculos_ibfk_1` FOREIGN KEY (`codEstado`) REFERENCES `estados` (`codEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `veiculos`
--

LOCK TABLES `veiculos` WRITE;
/*!40000 ALTER TABLE `veiculos` DISABLE KEYS */;
INSERT INTO `veiculos` VALUES (1,'ETO 7383',NULL,'Civic G10','458624',1,2,1),(2,'AAA 1111',NULL,NULL,'888888',1,NULL,1),(3,NULL,'FKR8D47','A 250','21859687',2,1,1);
/*!40000 ALTER TABLE `veiculos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-27 15:03:49
