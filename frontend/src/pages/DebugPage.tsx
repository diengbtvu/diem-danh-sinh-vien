import React from 'react'

export default function DebugPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug Page</h1>
      <p>This is a simple debug page to test if React is working.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  )
}
