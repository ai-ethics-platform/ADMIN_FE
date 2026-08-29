function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ko-KR')
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        이전
      </button>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => onPageChange(pageNumber)}
          disabled={pageNumber === page}
          aria-current={pageNumber === page ? 'page' : undefined}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        다음
      </button>
    </div>
  )
}

export default function SessionTable({
  items,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDetail,
  page,
  pageSize,
  total,
  onPageChange,
}) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="전체 선택"
                  checked={allSelected}
                  onChange={(event) => onToggleSelectAll(event.target.checked)}
                />
              </th>
              <th>No.</th>
              <th>이름</th>
              <th>근무지</th>
              <th>이메일</th>
              <th>대화시작시간</th>
              <th>대화마무리시간</th>
              <th>대화지속시간</th>
              <th>최종게임링크</th>
              <th>로그</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`${item.teacher_name} 선택`}
                    checked={selectedIds.has(item.id)}
                    onChange={() => onToggleSelect(item.id)}
                  />
                </td>
                <td>{(page - 1) * pageSize + index + 1}</td>
                <td>{item.teacher_name}</td>
                <td>{item.teacher_school}</td>
                <td>{item.teacher_email}</td>
                <td>{formatDateTime(item.started_at)}</td>
                <td>{formatDateTime(item.ended_at)}</td>
                <td>{formatDuration(item.duration_seconds)}</td>
                <td>
                  {item.game_url ? (
                    <a
                      href={item.game_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${item.teacher_name}의 게임 링크 (새 탭에서 열림)`}
                    >
                      링크
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(item.id)}
                    aria-label={`${item.teacher_name} 세션 로그 보기`}
                  >
                    Log
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  )
}
