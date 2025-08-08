import React, { useCallback, useEffect, useRef, useState } from 'react'

function useQuery() {
  return new URLSearchParams(window.location.search)
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return await res.blob()
}

export default function AttendPage() {
  const query = useQuery()
  const sessionToken = query.get('session') || ''
  const rotatingToken = query.get('rot') || ''

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionToken || !rotatingToken) {
      setError('Thiếu token điểm danh. Hãy quét QR trên màn hình lớp học.')
    }
  }, [sessionToken, rotatingToken])

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e) {
        setError('Không truy cập được camera. Hãy cho phép quyền camera.')
      }
    }
    startCamera()
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | undefined
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = video.videoWidth
    const h = video.videoHeight
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, w, h)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setPreviewUrl(dataUrl)
  }, [])

  const submit = useCallback(async () => {
    if (!previewUrl) return
    setSubmitting(true)
    setError(null)
    try {
      const blob = await dataUrlToBlob(previewUrl)
      const form = new FormData()
      form.append('sessionToken', sessionToken)
      form.append('rotatingToken', rotatingToken)
      form.append('image', blob, 'capture.jpg')
      const res = await fetch('http://localhost:8080/api/attendances', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error('Gửi điểm danh thất bại')
      const json = await res.json()
      setResult(json)
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }, [previewUrl, sessionToken, rotatingToken])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Điểm danh</h1>
      <p style={{ color: '#444' }}>Quét QR để vào trang này, sau đó chụp ảnh khuôn mặt để điểm danh.</p>

      {error && <div style={{ color: '#b00020', margin: '8px 0' }}>{error}</div>}

      <video ref={videoRef} playsInline muted style={{ width: '100%', borderRadius: 8, background: '#000' }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={capture} disabled={submitting} style={{ padding: '8px 12px', background: '#1976d2', color: '#fff', border: 0, borderRadius: 4 }}>Chụp ảnh</button>
        <button onClick={submit} disabled={!previewUrl || submitting} style={{ padding: '8px 12px', background: '#2e7d32', color: '#fff', border: 0, borderRadius: 4 }}>Gửi điểm danh</button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {previewUrl && (
        <div style={{ marginTop: 12 }}>
          <div>Ảnh xem trước:</div>
          <img src={previewUrl} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8 }} />
        </div>
      )}

      {result && (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
          <div>Trạng thái: <b>{result.status}</b></div>
          {result.mssv && <div>MSSV: {result.mssv}</div>}
          {result.hoTen && <div>Họ tên: {result.hoTen}</div>}
          {result.confidence != null && <div>Độ tin cậy: {result.confidence}</div>}
        </div>
      )}
    </div>
  )
}
