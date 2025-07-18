import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  score: number;
  matchingCases: Array<{
    id: string;
    caseNumber: string;
    score: number;
    matchReasons: string[];
    createdAt: Date;
  }>;
  threshold: number;
}

export interface DuplicateCheckRequest {
  claimantEmail: string;
  claimantName: string;
  claimantPhone?: string;
  respondentEmail: string;
  respondentName: string;
  respondentPhone?: string;
  disputeCategory?: string;
  disputeSubCategory?: string;
  disputeAmount?: number;
  disputeDescription?: string;
  userId: string;
}

@Injectable()
export class DuplicateDetectionService {
  private readonly DUPLICATE_THRESHOLD = 0.8; // 80% similarity threshold
  private readonly MODERATE_THRESHOLD = 0.6; // 60% similarity for warnings

  constructor(private prisma: PrismaService) {}

  async checkForDuplicates(request: DuplicateCheckRequest): Promise<DuplicateCheckResult> {
    // Get all existing cases for initial comparison
    const existingCases = await this.prisma.arbitration.findMany({
      where: {
        isDraft: false, // Only check against submitted cases
        status: {
          not: 'completed' // Don't check against completed cases
        }
      },
      select: {
        id: true,
        caseNumber: true,
        userId: true,
        createdAt: true,
        claimant: true,
        respondents: true,
        disputeDetails: true,
        formData: true,
      }
    });

    const matches: DuplicateCheckResult['matchingCases'] = [];

    for (const existingCase of existingCases) {
      const score = this.calculateSimilarityScore(request, existingCase);
      
      if (score >= this.MODERATE_THRESHOLD) {
        const matchReasons = this.getMatchReasons(request, existingCase, score);
        
        matches.push({
          id: existingCase.id,
          caseNumber: existingCase.caseNumber || 'N/A',
          score,
          matchReasons,
          createdAt: existingCase.createdAt,
        });
      }
    }

    // Sort by similarity score (highest first)
    matches.sort((a, b) => b.score - a.score);

    const highestScore = matches.length > 0 ? matches[0].score : 0;
    const isDuplicate = highestScore >= this.DUPLICATE_THRESHOLD;

    return {
      isDuplicate,
      score: highestScore,
      matchingCases: matches.slice(0, 5), // Return top 5 matches
      threshold: this.DUPLICATE_THRESHOLD,
    };
  }

  private calculateSimilarityScore(request: DuplicateCheckRequest, existingCase: any): number {
    let totalScore = 0;
    let maxScore = 0;

    // Parse existing case data
    const existingClaimant = existingCase.claimant || {};
    const existingRespondents = existingCase.respondents || [];
    const existingDispute = existingCase.disputeDetails || {};
    const existingFormData = existingCase.formData || {};

    // Check if it's the same user submitting (reduce score for legitimate multiple cases)
    const sameUser = existingCase.userId === request.userId;
    const userPenalty = sameUser ? 0 : 0.1; // Slight bonus for different users

    // 1. Claimant similarity (weight: 25%)
    const claimantScore = this.calculatePartyScore(
      {
        email: request.claimantEmail,
        name: request.claimantName,
        phone: request.claimantPhone,
      },
      {
        email: existingClaimant.email,
        name: existingClaimant.name,
        phone: existingClaimant.phone,
      }
    );
    totalScore += claimantScore * 0.25;
    maxScore += 0.25;

    // 2. Respondent similarity (weight: 25%)
    let maxRespondentScore = 0;
    for (const existingRespondent of existingRespondents) {
      const respondentScore = this.calculatePartyScore(
        {
          email: request.respondentEmail,
          name: request.respondentName,
          phone: request.respondentPhone,
        },
        {
          email: existingRespondent.email,
          name: existingRespondent.name,
          phone: existingRespondent.phone,
        }
      );
      maxRespondentScore = Math.max(maxRespondentScore, respondentScore);
    }
    totalScore += maxRespondentScore * 0.25;
    maxScore += 0.25;

    // 3. Dispute details similarity (weight: 30%)
    const disputeScore = this.calculateDisputeScore(request, existingDispute, existingFormData);
    totalScore += disputeScore * 0.3;
    maxScore += 0.3;

    // 4. Temporal factor (weight: 20%) - cases submitted closer in time are more suspicious
    const timeScore = this.calculateTimeScore(existingCase.createdAt);
    totalScore += timeScore * 0.2;
    maxScore += 0.2;

    // Apply user penalty
    totalScore = Math.max(0, totalScore - userPenalty);

    return maxScore > 0 ? totalScore / maxScore : 0;
  }

  private calculatePartyScore(party1: any, party2: any): number {
    if (!party1 || !party2) return 0;

    let score = 0;
    let factors = 0;

    // Email match (exact)
    if (party1.email && party2.email) {
      factors++;
      if (party1.email.toLowerCase() === party2.email.toLowerCase()) {
        score += 1;
      }
    }

    // Name similarity
    if (party1.name && party2.name) {
      factors++;
      const nameSimilarity = this.calculateStringSimilarity(
        party1.name.toLowerCase(),
        party2.name.toLowerCase()
      );
      score += nameSimilarity;
    }

    // Phone match
    if (party1.phone && party2.phone) {
      factors++;
      const cleanPhone1 = this.cleanPhoneNumber(party1.phone);
      const cleanPhone2 = this.cleanPhoneNumber(party2.phone);
      if (cleanPhone1 === cleanPhone2) {
        score += 1;
      }
    }

    return factors > 0 ? score / factors : 0;
  }

  private calculateDisputeScore(request: DuplicateCheckRequest, existingDispute: any, formData: any): number {
    let score = 0;
    let factors = 0;

    // Category match
    if (request.disputeCategory && existingDispute.disputeCategory) {
      factors++;
      if (request.disputeCategory === existingDispute.disputeCategory) {
        score += 0.8;
        
        // Sub-category match (if categories match)
        if (request.disputeSubCategory && existingDispute.disputeSubCategory) {
          if (request.disputeSubCategory === existingDispute.disputeSubCategory) {
            score += 0.2;
          }
        }
      }
    }

    // Amount similarity (if both exist)
    if (request.disputeAmount && existingDispute.disputeAmount) {
      factors++;
      const amountDiff = Math.abs(request.disputeAmount - existingDispute.disputeAmount);
      const avgAmount = (request.disputeAmount + existingDispute.disputeAmount) / 2;
      const amountSimilarity = Math.max(0, 1 - (amountDiff / avgAmount));
      score += amountSimilarity * 0.7;
    }

    // Description similarity
    if (request.disputeDescription && existingDispute.disputeDescription) {
      factors++;
      const descSimilarity = this.calculateStringSimilarity(
        request.disputeDescription.toLowerCase(),
        existingDispute.disputeDescription.toLowerCase()
      );
      score += descSimilarity * 0.8;
    }

    return factors > 0 ? score / factors : 0;
  }

  private calculateTimeScore(existingCaseDate: Date): number {
    const now = new Date();
    const diffDays = Math.abs(now.getTime() - existingCaseDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Higher score for cases submitted within the same period
    if (diffDays <= 1) return 1; // Same day
    if (diffDays <= 7) return 0.8; // Same week
    if (diffDays <= 30) return 0.6; // Same month
    if (diffDays <= 90) return 0.3; // Same quarter
    return 0.1; // Older cases
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance based similarity
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength > 0 ? 1 - (distance / maxLength) : 1;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, ''); // Remove all non-digits
  }

  private getMatchReasons(request: DuplicateCheckRequest, existingCase: any, score: number): string[] {
    const reasons: string[] = [];
    
    const existingClaimant = existingCase.claimant || {};
    const existingRespondents = existingCase.respondents || [];
    const existingDispute = existingCase.disputeDetails || {};

    // Check claimant matches
    if (request.claimantEmail && existingClaimant.email && 
        request.claimantEmail.toLowerCase() === existingClaimant.email.toLowerCase()) {
      reasons.push('Same claimant email');
    }

    if (request.claimantName && existingClaimant.name && 
        this.calculateStringSimilarity(request.claimantName.toLowerCase(), existingClaimant.name.toLowerCase()) > 0.8) {
      reasons.push('Very similar claimant name');
    }

    // Check respondent matches
    for (const existingRespondent of existingRespondents) {
      if (request.respondentEmail && existingRespondent.email && 
          request.respondentEmail.toLowerCase() === existingRespondent.email.toLowerCase()) {
        reasons.push('Same respondent email');
        break;
      }
      if (request.respondentName && existingRespondent.name && 
          this.calculateStringSimilarity(request.respondentName.toLowerCase(), existingRespondent.name.toLowerCase()) > 0.8) {
        reasons.push('Very similar respondent name');
        break;
      }
    }

    // Check dispute matches
    if (request.disputeCategory && existingDispute.disputeCategory && 
        request.disputeCategory === existingDispute.disputeCategory) {
      reasons.push('Same dispute category');
    }

    if (request.disputeDescription && existingDispute.disputeDescription && 
        this.calculateStringSimilarity(request.disputeDescription.toLowerCase(), existingDispute.disputeDescription.toLowerCase()) > 0.7) {
      reasons.push('Very similar dispute description');
    }

    if (score >= this.DUPLICATE_THRESHOLD) {
      reasons.push(`High similarity score (${Math.round(score * 100)}%)`);
    }

    return reasons;
  }
} 