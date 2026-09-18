import { useEffect, useState } from 'react'
import { apiGet } from '../api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { browserName, diagnosticLabel, diagnosticLocation, diagnosticSummary, diagnosticTime, isDiagnosticError } from '../lib/diagnostics'

export default function SessionDiagnostics({ sessionId }) {
  const [query, setQuery] = useState({ view: 'important', cursor: null, revision: 0 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    let cancelled = false
    setLoading(true)
    setError('')
    if (!query.cursor) setResult(null)
    const params = new URLSearchParams({ view: query.view })
    if (query.cursor) params.set('cursor', query.cursor)
    apiGet(`/api/sessions/${sessionId}/diagnostics?${params}`, { signal: controller.signal })
      .then(data => {
        if (cancelled) return
        setResult(previous => {
          const items = query.cursor ? [...(previous?.items || []), ...data.items] : data.items
          const unique = new Map(items.map(item => [`${item.trace_id}:${item.id}`, item]))
          return { ...data, items: [...unique.values()] }
        })
      })
      .catch(err => {
        if (cancelled) return
        setError(err.status === 401 ? '로그인이 만료되었습니다. 다시 로그인해 주세요.' :
          controller.signal.aborted ? '조회가 지연되고 있습니다. 다시 시도해 주세요.' : '진단 기록을 불러오지 못했습니다. 다시 시도해 주세요.')
      })
      .finally(() => { clearTimeout(timer); if (!cancelled) setLoading(false) })
    return () => { cancelled = true; clearTimeout(timer); controller.abort() }
  }, [sessionId, query])

  const items = result?.items || []
  const latest = items[0]
  const browsers = [...new Set(items.map(item => browserName(item.user_agent)))]
  const issueCount = items.filter(isDiagnosticError).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          표시 기록
          <select aria-label="진단 기록 필터" className="h-8 rounded-lg border bg-background px-2"
            value={query.view} onChange={event => setQuery({ view: event.target.value, cursor: null, revision: 0 })}>
            <option value="important">주요 동작</option>
            <option value="errors">오류·무응답</option>
            <option value="all">전체 (상태 신호 포함)</option>
          </select>
        </label>
        <Button variant="outline" disabled={loading} onClick={() => setQuery(prev => ({ ...prev, cursor: null, revision: prev.revision + 1 }))}>
          새로고침
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        최신 기록부터 표시합니다. 시각은 한국 시간이며 브라우저가 기록한 시각입니다.
        무응답 신호만으로 원인을 확정할 수는 없습니다.
      </p>
      {latest && (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">조회 {items.length}건</Badge>
            <Badge variant={issueCount ? 'destructive' : 'outline'}>조회된 오류·무응답 {issueCount}건</Badge>
          </div>
          <p className="text-sm font-medium">최근 표시 기록: {diagnosticLabel(latest)} · {diagnosticTime(latest.at)}</p>
          <p className="break-all text-xs text-muted-foreground">{diagnosticLocation(latest)}</p>
          <p className="break-all text-xs text-muted-foreground">{browsers.join(' / ')}</p>
        </div>
      )}
      {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">
        <span>{error}</span>
        <Button variant="outline" disabled={loading} onClick={() => setQuery(prev => ({ ...prev, revision: prev.revision + 1 }))}>다시 시도</Button>
      </div>}
      {loading && <p role="status" className="text-sm text-muted-foreground">진단 기록을 불러오는 중...</p>}
      {!loading && !error && !items.length && <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {query.view === 'errors' ? '이 세션에 수집된 오류·무응답 기록이 없습니다.' : '이 세션에 수집된 진단 기록이 없습니다.'}
        <p className="mt-2 text-xs">기록 기능 적용 전 세션이거나 아직 기록이 도착하지 않았을 수 있습니다.</p>
      </div>}
      <ol aria-label="진단 기록 타임라인" className="space-y-2">
        {items.map(event => (
          <li key={`${event.trace_id}:${event.id}`} className={`min-w-0 rounded-lg border p-3 ${isDiagnosticError(event) ? 'border-destructive/30 bg-destructive/5' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-sm font-medium ${isDiagnosticError(event) ? 'text-destructive' : ''}`}>{diagnosticLabel(event)}</span>
              <time dateTime={event.at} className="text-xs tabular-nums text-muted-foreground">{diagnosticTime(event.at)}</time>
            </div>
            <p className="mt-1 break-words text-sm [overflow-wrap:anywhere]">{diagnosticSummary(event)}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">{diagnosticLocation(event)}{event.busy ? ' · 처리 중' : ''}</p>
            <details className="mt-2 text-xs">
              <summary className="w-fit cursor-pointer text-muted-foreground">기술 정보</summary>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/60 p-3">{JSON.stringify({
                event: event.kind, browser: event.user_agent, build: event.build_id,
                session: event.session_id, game: event.game_code, trace: event.trace_id, id: event.id,
                browser_time: event.at, received_at: event.received_at, ...event.details,
              }, null, 2)}</pre>
            </details>
          </li>
        ))}
      </ol>
      {result?.next_cursor && <Button variant="outline" disabled={loading}
        onClick={() => setQuery(prev => ({ ...prev, cursor: result.next_cursor }))}>이전 기록 더 보기</Button>}
    </div>
  )
}
