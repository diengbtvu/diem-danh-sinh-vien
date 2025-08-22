import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiRequest } from '../config/api'

export default function SimpleAttendanceDetailPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!sessionId) return
      
      setLoading(true)
      setError(null)
      
      try {
        console.log('Fetching stats for sessionId:', sessionId)
        const response = await apiRequest(`/api/admin/stats/${sessionId}`)
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Stats data:', data)
          setStats(data)
        } else {
          setError(`API Error: ${response.status}`)
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError(`Network Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [sessionId])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Attendance Detail Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Session ID:</strong> {sessionId || 'Not provided'}
      </div>

      {loading && <div>Loading...</div>}
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {stats && (
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '15px', 
          borderRadius: '5px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Statistics</h3>
          <div>Total: {stats.total}</div>
          <div>Accepted: {stats.accepted}</div>
          <div>Review: {stats.review}</div>
          <div>Rejected: {stats.rejected}</div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h3>Debug Info</h3>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>
          {JSON.stringify({ sessionId, stats, loading, error }, null, 2)}
        </pre>
      </div>
    </div>
  )
}
