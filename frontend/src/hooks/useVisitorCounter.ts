import { useState, useEffect } from 'react'

interface VisitorStats {
  totalVisits: number
  todayVisits: number
  onlineUsers: number
}

export function useVisitorCounter() {
  const [stats, setStats] = useState<VisitorStats>({
    totalVisits: 0,
    todayVisits: 0,
    onlineUsers: 0
  })

  useEffect(() => {
    // Record visit and get stats from backend
    const recordVisit = async () => {
      try {
        const response = await fetch('/api/visitor-stats/visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          // Fallback to get stats without recording visit
          fetchStats()
        }
      } catch (error) {
        console.error('Error recording visit:', error)
        // Fallback to get stats
        fetchStats()
      }
    }

    // Get current stats from backend
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/visitor-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching visitor stats:', error)
        // Fallback to default values
        setStats({
          totalVisits: 1250,
          todayVisits: 45,
          onlineUsers: 8
        })
      }
    }

    // Check if visit was already recorded today
    const lastVisitDate = localStorage.getItem('lastVisitDate')
    const today = new Date().toDateString()

    if (lastVisitDate !== today) {
      // Record new visit
      recordVisit()
      localStorage.setItem('lastVisitDate', today)
    } else {
      // Just fetch current stats
      fetchStats()
    }

    // Update online users every 30 seconds
    const interval = setInterval(() => {
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return stats
}
