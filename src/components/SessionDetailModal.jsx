import { useEffect, useRef, useState } from 'react'
import { apiGet, downloadFile } from '../api/client'

export default function SessionDetailModal({ sessionId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!sessionId) {
      setDetail(null)
      return
    }

    let cancelled = false

    async function fetchDetail() {
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet(`/api/sessions/${sessionId}`)
        if (!cancelled) {
          setDetail(data)
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

    fetchDetail()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sessionId, onClose])

  useEffect(() => {
    if (!sessionId) return

    const focusableSelector =
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const firstFocusable = dialogRef.current?.querySelector(focusableSelector)
    firstFocusable?.focus()

    function handleTabTrap(event) {
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll(focusableSelector)
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleTabTrap)
    return () => document.removeEventListener('keydown', handleTabTrap)
  }, [sessionId, detail])

  if (!sessionId) {
    return null
  }

  function handleDownload() {
    downloadFile(`/api/sessions/${sessionId}/transcript?format=docx`)
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" aria-label="닫기" onClick={onClose}>
          ×
        </button>
        {loading && <p>불러오는 중...</p>}
        {error && <p role="alert">상세 정보를 불러오지 못했습니다</p>}
        {detail && (
          <>
            <h2 id="session-detail-title">
              Detailed Session Log : {detail.teacher_name}
            </h2>
            <button type="button" onClick={handleDownload}>
              다운로드
            </button>
            <table>
              <thead>
                <tr>
                  <th scope="col">발화자</th>
                  <th scope="col">내용</th>
                </tr>
              </thead>
              <tbody>
                {detail.messages?.map((message, index) => (
                  <tr key={index}>
                    <td>{message.role === 'user' ? '사용자' : '챗봇'}</td>
                    <td>{message.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  )
}
