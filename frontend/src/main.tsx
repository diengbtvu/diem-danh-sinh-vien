import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AttendPage from './pages/AttendPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/attend" element={<AttendPage />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
