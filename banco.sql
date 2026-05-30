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
-- Table structure for table `cidades`
--

DROP TABLE IF EXISTS `cidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cidades` (
  `codCidade` int NOT NULL AUTO_INCREMENT,
  `cidade` varchar(30) DEFAULT NULL,
  `codEstado` int DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codCidade`),
  KEY `codEs` (`codEstado`),
  CONSTRAINT `cidades_ibfk_1` FOREIGN KEY (`codEstado`) REFERENCES `estados` (`codEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `condicaopagamentos`
--

DROP TABLE IF EXISTS `condicaopagamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `condicaopagamentos` (
  `codCondicao` int NOT NULL AUTO_INCREMENT,
  `condicaoPagamento` varchar(10) NOT NULL,
  `percentualJuros` decimal(10,2) DEFAULT '0.00',
  `percentualMulta` decimal(10,2) DEFAULT '0.00',
  `percentualDesconto` decimal(10,2) DEFAULT '0.00',
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codCondicao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
-- Table structure for table `fornecedores`
--

DROP TABLE IF EXISTS `fornecedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fornecedores` (
  `codForn` int NOT NULL AUTO_INCREMENT,
  `fornecedor` varchar(50) DEFAULT NULL,
  `endereco` varchar(50) DEFAULT NULL,
  `bairro` varchar(50) DEFAULT NULL,
  `codCidade` int DEFAULT NULL,
  `cep` varchar(8) DEFAULT NULL,
  `fone` varchar(15) DEFAULT NULL,
  `email` varchar(30) DEFAULT NULL,
  `inscEst` varchar(13) DEFAULT NULL,
  `InscEstSubTrib` varchar(13) DEFAULT NULL,
  `cnpj` varchar(13) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codForn`),
  KEY `codCidade` (`codCidade`),
  CONSTRAINT `fornecedores_ibfk_1` FOREIGN KEY (`codCidade`) REFERENCES `cidades` (`codCidade`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parcelas`
--

DROP TABLE IF EXISTS `parcelas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parcelas` (
  `codParcela` int NOT NULL AUTO_INCREMENT,
  `codCondicao` int NOT NULL,
  `numeroParcela` int NOT NULL,
  `percentual` decimal(5,2) NOT NULL,
  `dias` int NOT NULL,
  `codFormaPagamento` int DEFAULT NULL,
  PRIMARY KEY (`codParcela`),
  KEY `codCondicao` (`codCondicao`),
  KEY `codFormaPagamento` (`codFormaPagamento`),
  CONSTRAINT `parcelas_ibfk_1` FOREIGN KEY (`codCondicao`) REFERENCES `condicaopagamentos` (`codCondicao`),
  CONSTRAINT `parcelas_ibfk_2` FOREIGN KEY (`codFormaPagamento`) REFERENCES `formapagamentos` (`codFormaPagamento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `codProd` int NOT NULL AUTO_INCREMENT,
  `produto` varchar(25) DEFAULT NULL,
  `ncmSh` varchar(10) DEFAULT NULL,
  `unidade` varchar(5) DEFAULT NULL,
  `pesoBruto` decimal(10,2) DEFAULT NULL,
  `pesoLiq` decimal(10,2) DEFAULT NULL,
  `saldo` decimal(10,2) DEFAULT NULL,
  `custoMedio` decimal(10,2) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codProd`),
  KEY `NCMSHPROD` (`ncmSh`),
  CONSTRAINT `produtos_ibfk_1` FOREIGN KEY (`ncmSh`) REFERENCES `ncmshs` (`ncmSh`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transportadores`
--

DROP TABLE IF EXISTS `transportadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transportadores` (
  `codTransp` int NOT NULL AUTO_INCREMENT,
  `CpfCnpj` varchar(13) DEFAULT NULL,
  `endereco` varchar(50) DEFAULT NULL,
  `codCidade` int DEFAULT NULL,
  `transportador` varchar(50) DEFAULT NULL,
  `inscEst` varchar(13) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codTransp`),
  KEY `codCidade` (`codCidade`),
  CONSTRAINT `transportadores_ibfk_1` FOREIGN KEY (`codCidade`) REFERENCES `cidades` (`codCidade`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `veiculos`
--

DROP TABLE IF EXISTS `veiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `veiculos` (
  `codVeic` int NOT NULL AUTO_INCREMENT,
  `placaVeic` varchar(11) DEFAULT NULL,
  `codEstado` int DEFAULT NULL,
  `codANTT` varchar(8) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codVeic`),
  KEY `codEstado` (`codEstado`),
  CONSTRAINT `veiculos_ibfk_1` FOREIGN KEY (`codEstado`) REFERENCES `estados` (`codEstado`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-15 21:54:21
