import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../api/client'
import { Button } from '@/components/ui/button'

const time = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const initial = { game_code: '', room_code: '', account_ref: '', message_id: '', date: '' }
const actions = {
  '/auth/login': '로그인', '/auth/login-json': '로그인',
  '/custom-games/{code}': '커스텀 게임 조회',
  '/rooms/create/public': '공개 방 생성', '/rooms/create/private': '비공개 방 생성',
  '/rooms/join/code': '방 참여', '/rooms/join/{room_id}': '방 참여',
  '/rooms/ready': '준비 상태 변경', '/rooms/page-arrival': '게임 페이지 도착',
}

const eventNames = {
  game_state_changed: '게임 상태 변경', custom_link_opened: '커스텀 링크 진입',
  custom_login_redirect: '로그인 후 이동', custom_game_load: '커스텀 게임 로드',
  room_game_verified: '방 게임 검증', waiting_room_game_context: '대기실 상태',
  game_start_transition: '게임 시작 이동', game_intro_rendered: '인트로 표시',
  game_story_rendered: '스토리 표시', game_role_description_rendered: '역할 설명 표시',
  navigation_broadcast: '서버 이동 명령 전송', navigation_received: '이동 명령 수신', navigation_selected: '이동 경로 선택',
}
const storySources = { custom_intro: '커스텀 안내', default_android_intro: '기본 안드로이드', default_aws_intro: '기본 AWS', default_story: '기본 스토리', custom_opening: '커스텀 시작 스토리', custom_background: '커스텀 배경', custom_role: '커스텀 역할', default_role: '기본 역할', missing_story: '스토리 없음', missing_role: '역할 없음' }

function ScreenComparison({ rows }) {
  const browsers = new Map()
  for (const row of rows || []) {
    const key = `${row.account_ref}:${row.page_id}`
    if (!browsers.has(key)) browsers.set(key, { row, events: {} })
    browsers.get(key).events[row.event] = row
  }
  return <section className="space-y-3 rounded border p-4">
    <h2 className="font-semibold">참가자별 최근 표시 기록</h2>
    <p className="text-xs text-muted-foreground">브라우저가 보고한 화면입니다. 공통 인트로끼리 비교하세요. 역할 설명은 역할별로 달라지는 것이 정상이며, 기록이 없는 참가자는 정상으로 판단할 수 없습니다. 같은 계정의 다른 탭·새로고침은 별도 표시됩니다. 최대 100개 관측값입니다.</p>
    {!browsers.size && <p className="text-sm">표시 기록이 아직 없습니다.</p>}
    <div className="grid gap-3 md:grid-cols-3">{[...browsers].map(([key, browser]) => <div key={key} className="space-y-2 rounded border p-3 text-sm">
      <div className="font-medium">{browser.row.account_ref || '계정 미확인'}</div>
      <div className="break-all text-xs">페이지 ID: {browser.row.page_id || '-'}</div>
      {['game_intro_rendered', 'game_story_rendered', 'game_role_description_rendered'].map(event => {
        const row = browser.events[event]
        const d = row?.details || {}
        return <div key={event} className="border-t pt-2">
          <div className="font-medium">{eventNames[event]}</div>
          {!row ? <div>기록 없음</div> : <>
            <div>{storySources[d.story_source] || d.story_source || row.path} · 역할 {row.role_id || '-'}</div>
            <div>방 연결: {row.room_game_code || '-'}</div><div>저장 / 로드: {row.game_code || '-'} / {row.loaded_code || '-'}</div>
            <div>{d.paragraph_index != null ? `스토리 문단 ${d.paragraph_index + 1}` : d.description_role_id ? `역할 설명 ${d.description_role_id}` : '공통 인트로'}</div>
            <div className="break-all">내용 지문: {d.story_fingerprint || '확인 불가'}</div>
            <div className="text-xs">관측 {time.format(new Date(row.client_at || row.at))}</div>
          </>}
        </div>
      })}
    </div>)}</div>
  </section>
}

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
    for (const key of ['game_code', 'room_code', 'account_ref', 'message_id']) if (query[key]) params.set(key, query[key])
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
  const filterMessage = message_id => {
    const values = { ...initial, message_id, date: query.date }
    setInput(values); setQuery({ ...values, page: 1, revision: query.revision + 1 })
  }
  return <main className="mx-auto max-w-7xl space-y-5 p-6">
    <Link to="/" className="text-sm underline">세션 로그로 돌아가기</Link>
    <h1 className="text-2xl font-semibold">게임 접속 진단</h1>
    <p className="text-sm">게임 코드(예: q16pyciln1)는 스토리를, 6자리 방 코드는 함께 플레이하는 방을 구분합니다. 같은 게임으로 여러 방을 만들 수 있습니다. 방 코드로 조회하면 생성·참여·준비 요청을 함께 확인할 수 있습니다.</p>
    <p className="text-sm text-muted-foreground">API 요청 기록과 브라우저 관측 보고를 구분해서 표시합니다. 브라우저 보고의 계정은 서버가 수신할 때 인증한 계정입니다. 페이지와 저장 상태는 요청을 보내기 직전의 브라우저 보고값이며, 방 게임과 준비 요청 코드는 서버에서 확인한 값입니다. 게임 조회 요청에서 요청 전 로드 코드가 비어 있는 것은 정상입니다. 시각은 한국 시간입니다. 계정 식별자를 누르면 다른 게임의 기록도 함께 조회합니다. 화면 전환 후 URL 코드가 없어지는 것은 정상일 수 있습니다. 적용 이전 기록은 소급 수집되지 않습니다.</p>
    <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setQuery({ ...input, page: 1, revision: query.revision + 1 }) }}>
      {[['game_code', '게임 코드'], ['room_code', '방 코드'], ['account_ref', '계정 식별자'], ['message_id', '이동 명령 ID'], ['date', '날짜']].map(([key, label]) => <label key={key} className="text-sm">{label}<input className="mt-1 block rounded border p-2" type={key === 'date' ? 'date' : 'text'} maxLength={key === 'account_ref' ? 16 : key === 'message_id' ? 80 : 20} value={input[key]} onChange={e => setInput(prev => ({ ...prev, [key]: e.target.value.trim() }))} /></label>)}
      <Button type="submit" disabled={loading}>조회</Button>
    </form>
    {loading && <p role="status">불러오는 중...</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {query.room_code && result && <ScreenComparison rows={result.screens} />}
    <p className="text-sm">총 {result?.total || 0}건</p>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['시각', '계정 / 역할', '페이지', '게임 상태', '방 코드 (6자리)', '동작 / 응답'].map(s => <th key={s} className="border-b p-2">{s}</th>)}</tr></thead><tbody>
      {result?.items?.map(row => <tr key={row.request_id} className="border-b align-top">
        <td className="whitespace-nowrap p-2">{time.format(new Date(row.at))}{row.client_at && <div className="text-xs">브라우저 관측 {time.format(new Date(row.client_at))}</div>}{row.sequence && <div className="text-xs">페이지 내 순서 #{row.sequence}</div>}</td>
        <td className="p-2"><button type="button" className="underline" disabled={!row.account_ref} onClick={() => filterAccount(row.account_ref)}>{row.account_ref || '계정 미확인'}</button><div>역할 {row.role_id || '-'}</div></td>
        <td className="p-2">{row.path || '페이지 미수신'}<div className="text-xs text-muted-foreground">{row.evidence_source === 'server_broadcast' ? '서버 소켓 전송 기록' : row.evidence_source === 'browser_report' ? '브라우저 관측 보고' : row.context_status === 'received' ? '상태 수신' : row.context_status === 'missing' ? '이전 클라이언트 / 상태 미수신' : '잘못된 상태 형식'}</div></td>
        <td className="p-2">{row.context_status !== 'received' ? '브라우저 상태 확인 불가' : <><div>URL: {row.url_code || '없음'}</div><div>저장: {row.game_code || '없음'}</div><div>{row.event ? '관측 시 로드' : '요청 전 로드'}: {row.loaded_code || '없음'}</div><div>{row.storage_state === 'unavailable' ? '저장소 읽기·해석 실패' : ''}</div></>}<div>연결 게임 코드: {row.room_game_code || '-'}</div>{row.submitted_game_code_recorded && <div>요청 게임 코드: {row.submitted_game_code || '없음'}</div>}</td>
        <td className="p-2">{row.room_code || '-'}</td>
        <td className="p-2"><div className="font-medium">{eventNames[row.event] || actions[row.endpoint] || 'API 요청'}</div>{row.event ? <div className="space-y-1 text-xs">
          <div>{row.details?.source} {row.details?.phase}</div>
          {row.event === 'game_state_changed' && <div>저장 {row.details?.before_code || '없음'} → {row.details?.after_code || '없음'}<br />로드 {row.details?.before_loaded_code || '없음'} → {row.details?.after_loaded_code || '없음'}</div>}
          {row.details?.story_source && <div>{storySources[row.details.story_source] || row.details.story_source}</div>}
          {row.details?.destination && <div>이동 대상: {row.details.destination}</div>}
          {row.details?.message_id && <button type="button" className="break-all text-left underline" onClick={() => filterMessage(row.details.message_id)}>명령 ID: {row.details.message_id}</button>}
        </div> : <div className="text-xs">{row.method} {row.endpoint}</div>}<div className={row.status >= 400 ? 'text-destructive' : ''}>{row.evidence_source === 'server_broadcast' ? row.status < 400 ? '소켓 쓰기 성공 (수신 보장 아님)' : '소켓 쓰기 실패' : `${row.event ? '관측 수집 응답' : 'HTTP'} ${row.status}`} </div><details><summary className="cursor-pointer text-xs">상세</summary><pre className="max-w-lg overflow-auto text-xs">{JSON.stringify(row, null, 2)}</pre></details></td>
      </tr>)}
    </tbody></table></div>
    {!loading && !error && result && !result.items.length && <p>수집된 기록이 없습니다.</p>}
    <div className="flex gap-3"><Button variant="outline" disabled={loading || query.page === 1} onClick={() => setQuery(q => ({ ...q, page: q.page - 1 }))}>이전</Button><span>{query.page} 페이지</span><Button variant="outline" disabled={loading || !result || query.page * 50 >= result.total} onClick={() => setQuery(q => ({ ...q, page: q.page + 1 }))}>다음</Button></div>
  </main>
}
