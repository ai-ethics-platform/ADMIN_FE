const SORT_OPTIONS = [
  { value: 'started_at:desc', label: '대화시작시간 (최신순)' },
  { value: 'started_at:asc', label: '대화시작시간 (오래된순)' },
  { value: 'duration:desc', label: '대화지속시간 (긴순)' },
  { value: 'duration:asc', label: '대화지속시간 (짧은순)' },
]

export default function SessionFilters({ filters, onFilterChange }) {
  const { search, startDate, endDate, sortBy, sortDir } = filters
  const sortValue = `${sortBy}:${sortDir}`

  function handleSearchChange(event) {
    onFilterChange({ search: event.target.value })
  }

  function handleStartDateChange(event) {
    onFilterChange({ startDate: event.target.value })
  }

  function handleEndDateChange(event) {
    onFilterChange({ endDate: event.target.value })
  }

  function handleSortChange(event) {
    const [nextSortBy, nextSortDir] = event.target.value.split(':')
    onFilterChange({ sortBy: nextSortBy, sortDir: nextSortDir })
  }

  return (
    <div>
      <div>
        <label htmlFor="session-search">검색</label>
        <input
          id="session-search"
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="이름, 이메일, 근무지로 검색"
        />
      </div>
      <div>
        <label htmlFor="session-start-date">시작일</label>
        <input
          id="session-start-date"
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
        />
      </div>
      <div>
        <label htmlFor="session-end-date">종료일</label>
        <input
          id="session-end-date"
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
        />
      </div>
      <div>
        <label htmlFor="session-sort">정렬</label>
        <select id="session-sort" value={sortValue} onChange={handleSortChange}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
