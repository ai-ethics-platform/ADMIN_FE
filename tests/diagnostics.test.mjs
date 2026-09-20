import test from 'node:test'
import assert from 'node:assert/strict'
import { browserName, diagnosticSummary, diagnosticTime, isDiagnosticError, diagnosticLocation } from '../src/lib/diagnostics.js'

test('diagnostics distinguish Edge, cancellations and missing details without rendering errors', () => {
  assert.equal(browserName('Mozilla/5.0 Chrome/153.0.0.0 Safari/537.36 Edg/153.0.1.0'), 'Edge 153.0.1.0')
  assert.equal(browserName('Mozilla/5.0 Chrome/153.0.0.0 Safari/537.36'), 'Chrome 153 (세부 버전 미수집)')
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

test('diagnostics use the Edge full version rather than the Chromium engine version', () => {
  const ua = 'Mozilla/5.0 Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'
  const versions = [{ brand: 'Chromium', version: '153.0.8010.37' },
    { brand: 'Not_A Brand', version: '99.0.0.0' }, { brand: 'Microsoft Edge', version: '153.0.4234.48' }]
  assert.equal(browserName(ua, versions), 'Edge 153.0.4234.48')
  assert.equal(browserName(ua), 'Edge 153 (세부 버전 미수집)')
  assert.equal(browserName(ua, versions.slice(0, 2)), 'Edge 153 (세부 버전 미수집)')
  assert.equal(browserName('Version/18.6 Safari/605.1.15'), 'Safari 18.6')
  assert.equal(browserName('Chrome/153.0.0.0', [{ brand: 'Google Chrome', version: '153.0.8010.37' }]), 'Chrome 153.0.8010.37')
  assert.equal(diagnosticSummary({ kind: 'diagnostic_status', user_agent: ua, browser_versions: versions,
    details: { event: 'browser_version' } }), 'Edge 153.0.4234.48')
  assert.equal(diagnosticSummary({ kind: 'action', details: { action: 'navigation_save', event: 'start' } }), '이동 전 저장 · 시작')
  assert.equal(diagnosticSummary({ kind: 'action', details: { action: 'navigation_save', event: 'end', blocked: true, duration_ms: 20 } }), '이동 전 저장 · 이동 취소 · 20ms')
  assert.equal(diagnosticSummary({ kind: 'action', details: { action: 'navigation_save', event: 'error', blocked: true } }), '이동 전 저장 · 예외로 이동 취소')
})
