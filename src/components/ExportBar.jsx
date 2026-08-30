import { downloadFile } from '../api/client'
import { Button } from '@/components/ui/button'

export default function ExportBar({ selectedIds, filterQueryString }) {
  const selectedCount = selectedIds.size

  function handleExport() {
    if (selectedCount > 0) {
      const ids = Array.from(selectedIds).join(',')
      downloadFile(`/api/sessions/export?ids=${ids}`)
    } else {
      downloadFile(`/api/sessions/export?${filterQueryString}`)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <span className="text-sm text-muted-foreground">
        {selectedCount}개 선택됨
      </span>
      <Button
        type="button"
        variant={selectedCount > 0 ? 'secondary' : 'default'}
        onClick={handleExport}
      >
        {selectedCount > 0 ? `선택 ${selectedCount}개 다운로드` : '전체 다운로드'}
      </Button>
    </div>
  )
}
