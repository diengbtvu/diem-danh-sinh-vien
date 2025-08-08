import React from 'react'
import { Box, Typography, Stepper, Step, StepLabel, StepContent } from '@mui/material'
import { CheckCircle, RadioButtonUnchecked, Schedule } from '@mui/icons-material'

interface StepData {
  label: string
  description?: string
  status: 'completed' | 'active' | 'pending'
}

interface StepIndicatorProps {
  steps: StepData[]
  orientation?: 'horizontal' | 'vertical'
}

export default function StepIndicator({ steps, orientation = 'vertical' }: StepIndicatorProps) {
  const activeStep = steps.findIndex(step => step.status === 'active')
  
  const getStepIcon = (status: StepData['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />
      case 'active':
        return <Schedule color="primary" />
      default:
        return <RadioButtonUnchecked color="disabled" />
    }
  }

  if (orientation === 'horizontal') {
    return (
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step, index) => (
          <Step key={index} completed={step.status === 'completed'}>
            <StepLabel 
              icon={getStepIcon(step.status)}
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: '0.875rem',
                  fontWeight: step.status === 'active' ? 600 : 400
                }
              }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    )
  }

  return (
    <Box>
      {steps.map((step, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ mr: 2, mt: 0.5 }}>
            {getStepIcon(step.status)}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: step.status === 'active' ? 600 : 400,
                color: step.status === 'completed' ? 'success.main' : 
                       step.status === 'active' ? 'primary.main' : 'text.secondary'
              }}
            >
              {step.label}
            </Typography>
            {step.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {step.description}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
