import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'

// Mock database for storing awards
let mockAwards: any[] = []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Restrict to ARBITRATOR role only
  if (session.user?.role !== 'ARBITRATOR') {
    return res.status(403).json({ error: 'Access denied. Only arbitrators can submit awards.' })
  }

  const { id: caseId } = req.query

  if (req.method === 'POST') {
    try {
      // Extract form data
      const {
        awardType,
        awardDate,
        caseSummary,
        claimantRepresentation,
        respondentRepresentation,
        issuesForDetermination,
        factsAndEvidence,
        legalAnalysis,
        findings,
        decision,
        hasMonetaryAward,
        monetaryAward,
        interestRate,
        interestFromDate,
        arbitrationCosts,
        costsAllocation,
        implementationDeadline,
        complianceRequirements,
        awardIsFinal,
        digitalSignatureConfirmed
      } = req.body

      // Validate required fields
      if (!awardType || !awardDate || !caseSummary || !claimantRepresentation || 
          !respondentRepresentation || !issuesForDetermination || !factsAndEvidence || 
          !legalAnalysis || !findings || !decision || !arbitrationCosts || 
          !costsAllocation || !implementationDeadline) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      if (!awardIsFinal || !digitalSignatureConfirmed) {
        return res.status(400).json({ error: 'Final confirmations must be accepted' })
      }

      // Create award record
      const awardRecord = {
        id: `award_${Date.now()}`,
        caseId,
        arbitratorId: session.user.id,
        awardType,
        awardDate,
        caseSummary,
        claimantRepresentation,
        respondentRepresentation,
        issuesForDetermination,
        factsAndEvidence,
        legalAnalysis,
        findings,
        decision,
        hasMonetaryAward: hasMonetaryAward === 'true',
        monetaryAward: hasMonetaryAward === 'true' ? monetaryAward : null,
        interestRate: hasMonetaryAward === 'true' ? interestRate : null,
        interestFromDate: hasMonetaryAward === 'true' ? interestFromDate : null,
        arbitrationCosts,
        costsAllocation,
        implementationDeadline,
        complianceRequirements,
        awardIsFinal: awardIsFinal === 'true',
        digitalSignatureConfirmed: digitalSignatureConfirmed === 'true',
        submittedAt: new Date().toISOString(),
        status: awardType === 'final' ? 'final_award_submitted' : 'interim_award_submitted'
      }

      // Store in mock database
      mockAwards.push(awardRecord)

      // In a real application, you would:
      // 1. Save to database
      // 2. Process file uploads
      // 3. Generate formal award document
      // 4. Send notifications to all parties
      // 5. Update case status to "award_issued"
      // 6. Trigger payment processing if monetary award
      // 7. Create enforcement records if needed

      res.status(201).json({
        message: 'Award submitted successfully',
        awardId: awardRecord.id,
        awardType: awardRecord.awardType,
        submittedAt: awardRecord.submittedAt,
        status: awardRecord.status
      })

    } catch (error) {
      console.error('Error submitting award:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'GET') {
    // Get award for a case (if exists)
    try {
      const award = mockAwards.find(a => a.caseId === caseId && a.arbitratorId === session.user?.id)
      
      if (!award) {
        return res.status(404).json({ error: 'Award not found' })
      }

      res.status(200).json(award)
    } catch (error) {
      console.error('Error fetching award:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    // Update award (for drafts)
    try {
      const awardIndex = mockAwards.findIndex(a => a.caseId === caseId && a.arbitratorId === session.user?.id)
      
      if (awardIndex === -1) {
        return res.status(404).json({ error: 'Award not found' })
      }

      // Update the award with new data
      const updatedData = req.body
      mockAwards[awardIndex] = {
        ...mockAwards[awardIndex],
        ...updatedData,
        updatedAt: new Date().toISOString()
      }

      res.status(200).json({
        message: 'Award updated successfully',
        award: mockAwards[awardIndex]
      })

    } catch (error) {
      console.error('Error updating award:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
} 