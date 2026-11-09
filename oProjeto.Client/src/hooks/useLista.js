import { useCallback, useEffect, useState } from 'react'

// Carrega uma lista (api.getAll) ao montar e devolve [linhas, recarregar].
export default function useLista(api) {
  const [rows, setRows] = useState([])
  const recarregar = useCallback(async () => {
    const dados = await api.getAll()
    setRows(dados)
    return dados
  }, [api])
  useEffect(() => { recarregar() }, [recarregar])
  return [rows, recarregar]
}
