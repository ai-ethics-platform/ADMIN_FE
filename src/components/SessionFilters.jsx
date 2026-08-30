import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  function handleSortChange(value) {
    const [nextSortBy, nextSortDir] = value.split(':')
    onFilterChange({ sortBy: nextSortBy, sortDir: nextSortDir })
  }

  return (
    <div className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="session-search">검색</Label>
        <Input
          id="session-search"
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="이름, 이메일, 근무지로 검색"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="session-start-date">시작일</Label>
        <Input
          id="session-start-date"
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="session-end-date">종료일</Label>
        <Input
          id="session-end-date"
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="session-sort">정렬</Label>
        <Select
          items={SORT_OPTIONS}
          value={sortValue}
          onValueChange={handleSortChange}
        >
          <SelectTrigger id="session-sort" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
