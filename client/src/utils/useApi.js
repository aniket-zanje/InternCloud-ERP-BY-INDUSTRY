import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

/** const { data, loading, error, reload } = useApi('/intern/tasks') */
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      setState({ data: await api.get(path), loading: false, error: null })
    } catch (e) {
      setState({ data: null, loading: false, error: e.message })
    }
  }, [path])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}
