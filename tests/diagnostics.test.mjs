import test from 'node:test'
import assert from 'node:assert/strict'
import { browserName, diagnosticSummary, diagnosticTime, isDiagnosticError, diagnosticLocation } from '../src/lib/diagnostics.js'

test('diagnostics distinguish Edge, cancellations and missing details without rendering errors', () => {
  assert.equal(browserName('Mozilla/5.0 Chrome/153.0.0.0 Safari/537.36 Edg/153.0.1.0'), 'Edge 153.0.1.0')
  assert.equal(browserName('Mozilla/5.0 Chrome/153.0.0.0 Safari/537.36'), 'Chrome 153.0.0.0')
  assert.equal(isDiagnosticError({ kind: 'request_error', details: { code: 'ERR_CANCELED' } }), false)
  assert.equal(isDiagnosticError({ kind: 'request_error' }), true)
  assert.equal(isDiagnosticError({ kind: 'main_unresponsive' }), true)
  assert.match(diagnosticSummary({ kind: 'main_unresponsive', details: { main_age_ms: 18000 } }), /18\.0초/)
  assert.doesNotMatch(diagnosticSummary({ kind: 'main_unresponsive' }), /NaN/)
  assert.equal(diagnosticSummary({ kind: 'long_task' }), '긴 화면 작업 감지')
  assert.match(diagnosticSummary({ kind: 'request_end', details: { endpoint: '/chat', method: 'POST', status: 200, duration_ms: 33000 } }), /HTTP 200/)
  assert.equal(diagnosticLocation({ path: '/editor/ABC', phase: '' }), '미리보기 · /editor/ABC')
  assert.match(diagnosticTime('2026-09-18T11:00:00Z'), /20:00:00/)
  assert.equal(diagnosticTime('invalid'), '시각 정보 없음')
})
