"use client"

import React from 'react'
import RespondentFormComplete from './respondent-form-complete'

interface RespondentFormProps {
  caseId: string
  caseData?: any
  round?: number
}

export default function RespondentForm({ caseId, caseData, round = 1 }: RespondentFormProps) {
  return (
    <RespondentFormComplete 
      caseId={caseId}
      caseData={caseData}
      round={round}
    />
  )
}