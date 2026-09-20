const labels = {
  page_start: '화면 열림', route: '화면 전환', state: '상태 변경', action: '처리 함수 실행',
  click: '클릭 수신', pointerdown: '포인터 누름', pointerup: '포인터 뗌', pointercancel: '포인터 취소',
  input: '입력 변경', keydown: '키 입력', selection: '텍스트 선택',
  dragstart: '드래그 시작', dragend: '드래그 종료', drop: '드롭', lifecycle: '탭 상태 변경',
  main_heartbeat: '화면 상태 신호', worker_heartbeat: '독립 상태 신호', main_unresponsive: '화면 무응답 감지',
  long_task: '긴 화면 작업', error: '브라우저 오류', react_error: '화면 렌더링 오류',
  unhandled_rejection: '비동기 처리 오류', resource_error: '리소스 로딩 오류',
  request_start: 'API 요청 시작', request_end: 'API 응답 수신', request_error: 'API 요청 실패',
  ingest_start: '관리자 기록 전송', ingest_end: '관리자 기록 저장', ingest_error: '관리자 기록 전송 실패',
  diagnostic_status: '진단 수집 상태',
}
const actions = {
  chat_send: '챗봇 메시지 전송', chat_init: '챗봇 단계 시작', chat_back: '이전 단계 이동',
  create_game: '게임 생성', save_dilemma: '상황·딜레마 저장', header_step: '제작 단계 이동',
  header_preview: '미리보기 전환', header_edit: '편집 전환',
  preview_next: '다음 문단', preview_previous: '이전 문단', preview_paragraph: '미리보기 문단 표시',
  screen_next: '다음 화면 이동', screen_back: '이전 화면 이동', navigation_save: '이동 전 저장',
}
const phases = { opening: '주제', question: '딜레마', flip: '반전', roles: '등장인물', ending: '마무리',
  save_dilemma: '상황 저장', dilemma: '상황 편집' }
const errors = new Set(['main_unresponsive', 'error', 'react_error', 'unhandled_rejection', 'resource_error', 'request_error', 'ingest_error'])
const formatter = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

export function isDiagnosticError(event) {
  return errors.has(event.kind) && !(event.kind === 'request_error' && event.details?.code === 'ERR_CANCELED')
}

export function diagnosticLabel(event) {
  if (event.kind === 'request_error' && event.details?.code === 'ERR_CANCELED') return 'API 요청 취소'
  return labels[event.kind] || event.kind
}

export function diagnosticSummary(event) {
  const d = event.details || {}
  if (event.kind === 'diagnostic_status' && d.event === 'browser_version') {
    return browserName(event.user_agent, event.browser_versions)
  }
  if (event.kind === 'main_unresponsive') return Number.isFinite(d.main_age_ms)
    ? `메인 화면의 상태 신호가 ${(d.main_age_ms / 1000).toFixed(1)}초 동안 없습니다.` : '메인 화면의 상태 신호가 지연되었습니다.'
  if (d.action === 'navigation_save') return `이동 전 저장 · ${d.event === 'start' ? '시작' :
    d.event === 'error' ? '예외로 이동 취소' : d.blocked ? '이동 취소' : '완료'}${d.duration_ms != null ? ` · ${d.duration_ms}ms` : ''}`
  if (d.endpoint) return [d.method, d.endpoint, d.status ? `HTTP ${d.status}` : '',
    d.duration_ms != null ? `${d.duration_ms.toLocaleString()}ms` : '', d.code || ''].filter(Boolean).join(' · ')
  if (d.action) return `${actions[d.action] || d.action}${d.blocked ? ' · 대기 상태로 실행되지 않음' : ''}${d.count != null ? ` · ${d.count + 1}번째` : ''}`
  if (d.message) return d.message
  if (d.target) return `${d.target}${d.disabled ? ' · 비활성 요소' : ''}`
  if (d.event) return d.event
  if (event.kind === 'long_task') return Number.isFinite(d.duration_ms) ? `${d.duration_ms.toLocaleString()}ms 동안 화면 작업 실행` : '긴 화면 작업 감지'
  return event.busy ? '처리 중' : '기록 수신'
}

export function diagnosticLocation(event) {
  const screen = event.path?.startsWith('/chatpage') ? '챗봇' : event.path?.startsWith('/create') ? '편집' : event.path?.startsWith('/editor') ? '미리보기' : '제작 화면'
  return [screen, phases[event.phase] || event.phase, event.path].filter(Boolean).join(' · ')
}

export function diagnosticTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '시각 정보 없음' : formatter.format(date)
}

export function browserName(ua = '', versions = []) {
  for (const [pattern, name, brand] of [[/Edg(?:A|iOS)?\/([\d.]+)/, 'Edge', 'Microsoft Edge'],
    [/Chrome\/([\d.]+)/, 'Chrome', 'Google Chrome'], [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Version\/([\d.]+).*Safari/, 'Safari']]) {
    const match = ua.match(pattern)
    if (!match) continue
    const fullVersion = brand && versions.find(item => item.brand === brand)?.version
    if (fullVersion) return `${name} ${fullVersion}`
    if (brand && /^\d+\.0\.0\.0$/.test(match[1])) return `${name} ${match[1].split('.')[0]} (세부 버전 미수집)`
    return `${name} ${match[1]}`
  }
  return ua || '브라우저 정보 없음'
}
