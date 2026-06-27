import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import PaisesPage from './pages/Localizacao/PaisesPage'
import EstadosPage from './pages/Localizacao/EstadosPage'
import CidadesPage from './pages/Localizacao/CidadesPage'
import FornecedoresPage from './pages/Parceiros/FornecedoresPage'
import TransportadoresPage from './pages/Parceiros/TransportadoresPage'
import VeiculosPage from './pages/Parceiros/VeiculosPage'
import NcmPage from './pages/Fiscal/NcmPage'
import ProdutosPage from './pages/Produtos/ProdutosPage'
import NfePage from './pages/Fiscal/NfePage'
import ProdNfePage from './pages/Fiscal/ProdNfePage'
import ContasPagarPage from './pages/Financeiro/ContasPagarPage'
import FormaPagamentoPage from './pages/Financeiro/FormaPagamentoPage'
import CondicaoPagamentoPage from './pages/Financeiro/CondicaoPagamentoPage'
import LogsPage from './pages/Registros/LogsPage'
import MarcasPage from './pages/Produtos/MarcasPage'
import CategoriasPage from './pages/Produtos/CatrgoriasPage'
import FuncoesPage from './pages/Funcionarios/FuncoesPage'
import FuncionariosPage from './pages/Funcionarios/FuncionariosPage'
import ClientesPage from './pages/Parceiros/ClientesPage'

export default function App() {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <main style={{ marginLeft:230, flex:1, padding:32, minHeight:'100vh' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/paises" replace />} />
          <Route path="/paises" element={<PaisesPage />} />
          <Route path="/estados" element={<EstadosPage />} />
          <Route path="/cidades" element={<CidadesPage />} />
          <Route path="/fornecedores" element={<FornecedoresPage />} />
          <Route path="/transportadores" element={<TransportadoresPage />} />
          <Route path="/veiculos" element={<VeiculosPage />} />
          <Route path="/ncm" element={<NcmPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/nfe" element={<NfePage />} />
          <Route path="/prodnfe" element={<ProdNfePage />} />
          <Route path="/contaspagar" element={<ContasPagarPage />} />
          <Route path="/formapagamento" element={<FormaPagamentoPage />} />
          <Route path="/condicaoPagamentos" element={<CondicaoPagamentoPage />} />
          <Route path="/logs" element={<LogsPage/>} />
          <Route path="/marcas" element={<MarcasPage/>} />
          <Route path="/categorias" element={<CategoriasPage/>} />    
          <Route path="/funcoes" element={<FuncoesPage/>} />   
          <Route path='/funcionarios' element={<FuncionariosPage/>} />
          <Route path='/clientes' element={<ClientesPage/>} />   
        </Routes>
      </main>
      <Toaster position="bottom-right" toastOptions={{
        style: { fontFamily:'Outfit, sans-serif', fontSize:13, borderRadius:8 },
        success: { iconTheme: { primary:'#16a34a', secondary:'#fff' } },
        error:   { iconTheme: { primary:'#dc2626', secondary:'#fff' } },
      }} />
    </div>
  )
}
