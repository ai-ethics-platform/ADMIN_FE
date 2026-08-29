import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../api/client'

export function useSessions({
  search = '',
  startDate = '',
  endDate = '',
  sortBy = 'started_at',
  sortDir = 'desc',
  page = 1,
  pageSize = 20,
} = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchSessions() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        params.set('sortBy', sortBy)
        params.set('sortDir', sortDir)
        params.set('page', page)
        params.set('pageSize', pageSize)

        const data = await apiGet(`/api/sessions?${params.toString()}`)
        if (!cancelled) {
          setItems(data.items || [])
          setTotal(data.total || 0)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchSessions()

    return () => {
      cancelled = true
    }
  }, [search, startDate, endDate, sortBy, sortDir, page, pageSize, reloadToken])

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  return { items, total, loading, error, refetch }
}
