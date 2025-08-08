import React from 'react'
import { Card, CardProps, Grow } from '@mui/material'
import { SxProps, Theme } from '@mui/material/styles'

interface AnimatedCardProps extends CardProps {
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  hover?: boolean
}

export default function AnimatedCard({ 
  children, 
  delay = 0, 
  direction = 'up',
  hover = true,
  sx,
  ...props 
}: AnimatedCardProps) {
  const getTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(20px)'
      case 'down': return 'translateY(-20px)'
      case 'left': return 'translateX(20px)'
      case 'right': return 'translateX(-20px)'
      default: return 'translateY(20px)'
    }
  }

  return (
    <Grow in timeout={600 + delay * 100}>
      <Card
        {...props}
        sx={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateY(0)',
          ...(hover && {
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              '& .MuiCardContent-root': {
                transform: 'scale(1.02)'
              }
            }
          }),
          '& .MuiCardContent-root': {
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          },
          ...sx
        }}
      >
        {children}
      </Card>
    </Grow>
  )
}
