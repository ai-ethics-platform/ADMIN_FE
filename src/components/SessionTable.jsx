import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ko-KR')
}

function formatCount(value) {
  if (value === null || value === undefined) return '—'
  return value
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function TablePagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const isFirstPage = page <= 1
  const isLastPage = page >= totalPages

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="이전"
            aria-label="이전 페이지"
            aria-disabled={isFirstPage}
            className={isFirstPage ? 'pointer-events-none opacity-50' : undefined}
            onClick={(event) => {
              event.preventDefault()
              if (!isFirstPage) onPageChange(page - 1)
            }}
          />
        </PaginationItem>
        {pages.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href="#"
              isActive={pageNumber === page}
              aria-label={`${pageNumber} 페이지`}
              onClick={(event) => {
                event.preventDefault()
                onPageChange(pageNumber)
              }}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            text="다음"
            aria-label="다음 페이지"
            aria-disabled={isLastPage}
            className={isLastPage ? 'pointer-events-none opacity-50' : undefined}
            onClick={(event) => {
              event.preventDefault()
              if (!isLastPage) onPageChange(page + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
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
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 pl-4">
                <Checkbox
                  aria-label="전체 선택"
                  checked={allSelected}
                  onCheckedChange={(checked) => onToggleSelectAll(checked)}
                />
              </TableHead>
              <TableHead className="w-14">No.</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>근무지</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>턴테이킹수</TableHead>
              <TableHead>대화시작시간</TableHead>
              <TableHead>대화마무리시간</TableHead>
              <TableHead>대화지속시간</TableHead>
              <TableHead>최종게임링크</TableHead>
              <TableHead className="pr-4">로그</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow
                key={item.id}
                data-state={selectedIds.has(item.id) ? 'selected' : undefined}
              >
                <TableCell className="pl-4">
                  <Checkbox
                    aria-label={`${item.teacher_name} 선택`}
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => onToggleSelect(item.id)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {(page - 1) * pageSize + index + 1}
                </TableCell>
                <TableCell className="font-medium">{item.teacher_name}</TableCell>
                <TableCell>{item.teacher_school}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.teacher_email}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatCount(item.turn_count)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatDateTime(item.started_at)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatDateTime(item.ended_at)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatDuration(item.duration_seconds)}
                </TableCell>
                <TableCell>
                  {item.game_url ? (
                    <a
                      href={item.game_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${item.teacher_name}의 게임 링크 (새 탭에서 열림)`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      링크
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="pr-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenDetail(item.id)}
                    aria-label={`${item.teacher_name} 세션 로그 보기`}
                  >
                    Log
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  )
}
