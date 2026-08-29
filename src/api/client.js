const BASE = import.meta.env.VITE_ADMIN_API_BASE_URL

async function handleResponse(response) {
  if (!response.ok) {
    let data = null
    try {
      data = await response.json()
    } catch {
      // response body is not JSON, ignore
    }
    const error = new Error(data?.message || `요청이 실패했습니다 (${response.status})`)
    error.status = response.status
    error.data = data
    throw error
  }
  if (response.status === 204) {
    return null
  }
  return response.json()
}

export async function apiGet(path) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  return handleResponse(response)
}

export async function apiPost(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse(response)
}

export async function downloadFile(path) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = new Error(`다운로드가 실패했습니다 (${response.status})`)
    error.status = response.status
    throw error
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  const filename = match ? decodeURIComponent(match[1]) : 'download'

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
