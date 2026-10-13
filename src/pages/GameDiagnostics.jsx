import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../api/client'
import { Button } from '@/components/ui/button'

const time = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const initial = { game_code: '', room_code: '', account_ref: '', date: '' }

export default function GameDiagnostics() {
  const [input, setInput] = useState(initial)
  const [query, setQuery] = useState({ ...initial, page: 1, revision: 0 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    let active = true
    const params = new URLSearchParams({ page: query.page, page_size: 50 })
    for (const key of ['game_code', 'room_code', 'account_ref']) if (query[key]) params.set(key, query[key])
    if (query.date) {
      params.set('since', `${query.date}T00:00:00+09:00`)
      params.set('until', `${query.date}T23:59:59.999999+09:00`)
    }
    setLoading(true); setError(''); setResult(null)
    apiGet(`/api/game-diagnostics?${params}`, { signal: controller.signal })
      .then(data => { if (active) setResult(data) })
      .catch(() => { if (active) setError('기록을 불러오지 못했습니다. 로그인 상태를 확인하고 다시 조회해 주세요.') })
      .finally(() => { clearTimeout(timer); if (active) setLoading(false) })
    return () => { active = false; clearTimeout(timer); controller.abort() }
  }, [query])
  const filterAccount = account_ref => {
    const values = { ...initial, account_ref, date: query.date }
    setInput(values); setQuery({ ...values, page: 1, revision: query.revision + 1 })
  }
  return <main className="mx-auto max-w-7xl space-y-5 p-6">
    <Link to="/" className="text-sm underline">세션 로그로 돌아가기</Link>
    <h1 className="text-2xl font-semibold">게임 접속 진단</h1>
    <p className="text-sm text-muted-foreground">백엔드가 실제 받은 요청입니다. 페이지와 저장 상태는 요청을 보내기 직전의 브라우저 보고값이며, 방 게임과 준비 요청 코드는 서버에서 확인한 값입니다. 게임 조회 요청에서 요청 전 로드 코드가 비어 있는 것은 정상입니다. 시각은 한국 시간입니다. 계정 식별자를 누르면 다른 게임의 기록도 함께 조회합니다. 화면 전환 후 URL 코드가 없어지는 것은 정상일 수 있습니다. 적용 이전 기록은 소급 수집되지 않습니다.</p>
    <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setQuery({ ...input, page: 1, revision: query.revision + 1 }) }}>
      {[['game_code', '게임 코드'], ['room_code', '방 코드'], ['account_ref', '계정 식별자'], ['date', '날짜']].map(([key, label]) => <label key={key} className="text-sm">{label}<input className="mt-1 block rounded border p-2" type={key === 'date' ? 'date' : 'text'} maxLength={key === 'account_ref' ? 16 : 20} value={input[key]} onChange={e => setInput(prev => ({ ...prev, [key]: e.target.value.trim() }))} /></label>)}
      <Button type="submit" disabled={loading}>조회</Button>
    </form>
    {loading && <p role="status">불러오는 중...</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <p className="text-sm">총 {result?.total || 0}건</p>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['시각', '계정 / 역할', '페이지', '게임 상태', '방', '요청 / 응답'].map(s => <th key={s} className="border-b p-2">{s}</th>)}</tr></thead><tbody>
      {result?.items?.map(row => <tr key={row.request_id} className="border-b align-top">
        <td className="whitespace-nowrap p-2">{time.format(new Date(row.at))}</td>
        <td className="p-2"><button type="button" className="underline" disabled={!row.account_ref} onClick={() => filterAccount(row.account_ref)}>{row.account_ref || '계정 미확인'}</button><div>역할 {row.role_id || '-'}</div></td>
        <td className="p-2">{row.path || '페이지 미수신'}<div className="text-xs text-muted-foreground">{row.context_status === 'received' ? '상태 수신' : row.context_status === 'missing' ? '이전 클라이언트 / 상태 미수신' : '잘못된 상태 형식'}</div></td>
        <td className="p-2">{row.context_status !== 'received' ? '브라우저 상태 확인 불가' : <><div>URL: {row.url_code || '없음'}</div><div>저장: {row.game_code || '없음'}</div><div>요청 전 로드: {row.loaded_code || '없음'}</div><div>{row.storage_state === 'unavailable' ? '저장소 읽기·해석 실패' : ''}</div></>}<div>방 게임: {row.room_game_code || '-'}</div>{row.submitted_game_code_recorded && <div>준비 요청 코드: {row.submitted_game_code || '없음'}</div>}</td>
        <td className="p-2">{row.room_code || '-'}</td>
        <td className="p-2"><div>{row.method} {row.endpoint}</div><div className={row.status >= 400 ? 'text-destructive' : ''}>HTTP {row.status}</div><details><summary className="cursor-pointer text-xs">상세</summary><pre className="max-w-lg overflow-auto text-xs">{JSON.stringify(row, null, 2)}</pre></details></td>
      </tr>)}
    </tbody></table></div>
    {!loading && !error && result && !result.items.length && <p>수집된 기록이 없습니다.</p>}
    <div className="flex gap-3"><Button variant="outline" disabled={loading || query.page === 1} onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}>이전</Button><span>{query.page} 페이지</span><Button variant="outline" disabled={loading || !result || query.page * 50 >= result.total} onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}>다음</Button></div>
  </main>
}
