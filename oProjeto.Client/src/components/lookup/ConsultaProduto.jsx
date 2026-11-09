import LookupModal from './LookupModal'
import { Inp, NumberField, LookupField } from '@/components/form'
import { colsProdutos, colsMarcas, colsCategorias } from '@/constants/cadastros'

// Modais Produto -> Categoria / Marca (use com useConsultaProduto).
//  cols  colunas da consulta de produtos (padrão: Cód., Produto, Unidade)
export default function ConsultaProduto({ ctrl, cols = colsProdutos }) {
  const { m, produtos, marcas, categorias, novoProduto, novaMarca, novaCategoria } = ctrl
  const marcaLabel = marcas.find(x => x.codMarca === novoProduto.form.codMarca)?.marca ?? ''
  const categoriaLabel = categorias.find(c => c.codCategoria === novoProduto.form.codCategoria)?.categoria ?? ''

  return (
    <>
      <LookupModal {...m.modal('produto')} title="Consulta de Produtos" maxWidth={640} zIndex={70}
        cols={cols} rows={produtos} onSelect={ctrl.selecionar}
        paused={m.isOpen('marca') || m.isOpen('categoria')}
        novo={{
          cadastro: novoProduto, titulo: 'Novo Produto', salvarLabel: 'Salvar Produto',
          campos: (
            <>
              <Inp label="Produto *" value={novoProduto.form.produto} onChange={v => novoProduto.upd('produto', v)} placeholder="Nome do produto" style={{ flex: '1 1 220px' }} />
              <Inp label="Unidade" value={novoProduto.form.unidade} onChange={v => novoProduto.upd('unidade', v)} maxLength={6} placeholder="UN" style={{ flex: '0 0 90px' }} />
              <LookupField label="Categoria" value={categoriaLabel} onSearch={() => { novaCategoria.setShow(false); m.abrir('categoria') }} style={{ flex: '1 1 180px' }} />
              <LookupField label="Marca" value={marcaLabel} onSearch={() => { novaMarca.setShow(false); m.abrir('marca') }} style={{ flex: '1 1 180px' }} />
              <NumberField label="Preço Venda (R$)" value={novoProduto.form.precoVenda} onChange={v => novoProduto.upd('precoVenda', v)} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
            </>
          ),
        }} />

      <LookupModal {...m.modal('categoria')} title="Consulta de Categorias" maxWidth={560} zIndex={80}
        cols={colsCategorias} rows={categorias}
        onSelect={r => { novoProduto.upd('codCategoria', r.codCategoria); m.fechar('categoria') }}
        novo={{
          cadastro: novaCategoria, titulo: 'Nova Categoria', salvarLabel: 'Salvar Categoria',
          campos: <Inp label="Categoria *" value={novaCategoria.form.categoria} onChange={v => novaCategoria.upd('categoria', v)} style={{ flex: '1 1 240px' }} />,
        }} />

      <LookupModal {...m.modal('marca')} title="Consulta de Marcas" maxWidth={560} zIndex={80}
        cols={colsMarcas} rows={marcas}
        onSelect={r => { novoProduto.upd('codMarca', r.codMarca); m.fechar('marca') }}
        novo={{
          cadastro: novaMarca, titulo: 'Nova Marca', salvarLabel: 'Salvar Marca',
          campos: <Inp label="Marca *" value={novaMarca.form.marca} onChange={v => novaMarca.upd('marca', v)} style={{ flex: '1 1 240px' }} />,
        }} />
    </>
  )
}
