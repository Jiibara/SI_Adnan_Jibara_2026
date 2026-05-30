import { useEffect, useState } from 'react'

export default function useCrud(api, deps = []) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setData(await api.getAll())
    setLoading(false)
  }

  useEffect(() => { load() }, deps)

  return { data, loading, load }
}