import React, { useEffect, useState } from 'react'
import { Container, Typography, Paper, Box } from '@mui/material'

export default function TestPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching stats...')
        const response = await fetch('/api/admin/stats/8e94530d-def6-4f86-9b3e-79546f13ce13')
        console.log('Response status:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('Data received:', data)
          setStats(data)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
    
    fetchStats()
  }, [])

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Test Page
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          API Test Results
        </Typography>
        
        {stats ? (
          <Box>
            <Typography>Total: {stats.total}</Typography>
            <Typography>Accepted: {stats.accepted}</Typography>
            <Typography>Review: {stats.review}</Typography>
            <Typography>Rejected: {stats.rejected}</Typography>
          </Box>
        ) : (
          <Typography>Loading...</Typography>
        )}
      </Paper>
    </Container>
  )
}
