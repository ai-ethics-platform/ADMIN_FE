import { useEffect, useState } from 'react'
import { apiGet, downloadFile } from '../api/client'
import { Button } from '@/components/ui/button'
import { Tabs } from '@base-ui/react/tabs'
import SessionDiagnostics from './SessionDiagnostics'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function SessionDetailModal({ sessionId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sessionId) {
      setDetail(null)
      return
    }

    let cancelled = false

    async function fetchDetail() {
      setLoading(true)
      setDetail(null)
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

  function handleDownload() {
    downloadFile(`/api/sessions/${sessionId}/transcript?format=csv`)
  }

  return (
    <Dialog
      open={Boolean(sessionId)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90svh] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="pr-8">
            {detail
              ? `Detailed Session Log : ${detail.teacher_name}`
              : 'Detailed Session Log'}
          </DialogTitle>
        </DialogHeader>
        <Tabs.Root key={sessionId} defaultValue="conversation">
          <Tabs.List aria-label="세션 기록 종류" className="mb-4 flex gap-1 border-b">
            <Tabs.Tab value="conversation" className="cursor-pointer border-b-2 border-transparent px-3 py-2 text-sm data-active:border-primary data-active:font-semibold">대화 기록</Tabs.Tab>
            <Tabs.Tab value="diagnostics" className="cursor-pointer border-b-2 border-transparent px-3 py-2 text-sm data-active:border-primary data-active:font-semibold">진단 기록</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="conversation" className="max-h-[55svh] overflow-y-auto">
          {loading && (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              상세 정보를 불러오지 못했습니다
            </p>
          )}
          {detail && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead scope="col" className="w-24">
                    발화자
                  </TableHead>
                  <TableHead scope="col">내용</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.messages?.map((message, index) => (
                  <TableRow key={index}>
                    <TableCell className="align-top font-medium">
                      {message.role === 'user' ? '사용자' : '챗봇'}
                    </TableCell>
                    <TableCell className="align-top whitespace-pre-wrap">
                      {message.content}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          </Tabs.Panel>
          <Tabs.Panel value="diagnostics" className="max-h-[60svh] overflow-y-auto pr-1">
            <SessionDiagnostics key={sessionId} sessionId={sessionId} />
          </Tabs.Panel>
        </Tabs.Root>
        <DialogFooter>
          {detail && (
            <Button type="button" onClick={handleDownload}>
              대화 다운로드
            </Button>
          )}
          <DialogClose render={<Button type="button" variant="outline" />}>
            닫기
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
