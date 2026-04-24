import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import PaisesPage from './pages/PaisesPage'
import EstadosPage from './pages/EstadosPage'
import { CidadesPage, FornecedoresPage, TransportadoresPage, VeiculosPage, NcmPage, ProdutosPage } from './pages/CadastrosPages'
import NfePage from './pages/NfePage'
import { ProdNfePage, ContasPagarPage } from './pages/FinanceiroPages'

export default function App() {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <main style={{ marginLeft:230, flex:1, padding:32, minHeight:'100vh' }}>
        <Routes>
          <Route path="/"                element={<Navigate to="/paises" replace />} />
          <Route path="/paises"          element={<PaisesPage />} />
          <Route path="/estados"         element={<EstadosPage />} />
          <Route path="/cidades"         element={<CidadesPage />} />
          <Route path="/fornecedores"    element={<FornecedoresPage />} />
          <Route path="/transportadores" element={<TransportadoresPage />} />
          <Route path="/veiculos"        element={<VeiculosPage />} />
          <Route path="/ncm"             element={<NcmPage />} />
          <Route path="/produtos"        element={<ProdutosPage />} />
          <Route path="/nfe"             element={<NfePage />} />
          <Route path="/prodnfe"         element={<ProdNfePage />} />
          <Route path="/contaspagar"     element={<ContasPagarPage />} />
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
