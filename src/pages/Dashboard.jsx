import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSessions } from '../hooks/useSessions'
import SessionFilters from '../components/SessionFilters'
import SessionTable from '../components/SessionTable'
import ExportBar from '../components/ExportBar'
import SessionDetailModal from '../components/SessionDetailModal'

const DEFAULT_FILTERS = {
  search: '',
  startDate: '',
  endDate: '',
  sortBy: 'started_at',
  sortDir: 'desc',
}

const PAGE_SIZE = 20

export default function Dashboard() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [detailSessionId, setDetailSessionId] = useState(null)

  const { items, total, loading, error } = useSessions({
    ...filters,
    page,
    pageSize: PAGE_SIZE,
  })

  function handleFilterChange(partial) {
    setFilters((prev) => ({ ...prev, ...partial }))
    setPage(1)
  }

  function handleToggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleToggleSelectAll(checked) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        items.forEach((item) => next.add(item.id))
      } else {
        items.forEach((item) => next.delete(item.id))
      }
      return next
    })
  }

  const filterQueryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    return params.toString()
  }, [filters])

  return (
    <div className="min-h-svh bg-muted/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          세션 로그
        </h1>
        <Link to="/game-diagnostics" className="w-fit text-sm underline">게임 접속 진단 보기</Link>
        <SessionFilters filters={filters} onFilterChange={handleFilterChange} />
        <ExportBar selectedIds={selectedIds} filterQueryString={filterQueryString} />
        {loading && (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            목록을 불러오지 못했습니다
          </p>
        )}
        <SessionTable
          items={items}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onOpenDetail={setDetailSessionId}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
        <SessionDetailModal
          sessionId={detailSessionId}
          onClose={() => setDetailSessionId(null)}
        />
      </div>
    </div>
  )
}
