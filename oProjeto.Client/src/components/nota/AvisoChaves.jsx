// Aviso exibido enquanto a chave da nota (Número, Série, Modelo e parceiro) não está completa.
export default function AvisoChaves({ parceiro = 'Fornecedor' }) {
  return (
    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e6ed', background: '#fff7ed', color: '#b45309', fontSize: 13, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
      ⚠ Preencha Número, Série, Modelo e selecione o {parceiro} antes de adicionar itens.
    </div>
  )
}
