import { downloadFile } from '../api/client'

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
    <div>
      <span>{selectedCount}개 선택됨</span>
      <button type="button" onClick={handleExport}>
        {selectedCount > 0 ? `선택 ${selectedCount}개 다운로드` : '전체 다운로드'}
      </button>
    </div>
  )
}
