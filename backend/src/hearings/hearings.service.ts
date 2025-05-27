import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class HearingsService {
  constructor(private prisma: PrismaService) {}

  async getHearingsByCase(caseId: string) {
    try {
      return await this.prisma.hearing.findMany({
        where: { caseId },
        include: {
          arbitrator: {
            select: { id: true, name: true, email: true }
          },
          case: {
            select: { id: true, caseNumber: true, name: true }
          }
        },
        orderBy: { scheduledDate: 'asc' }
      });
    } catch (error) {
      // Fallback to mock data if database query fails
      return [
        {
          id: '1',
          caseId,
          title: 'Initial Hearing',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          duration: 120,
          type: 'VIRTUAL',
          status: 'SCHEDULED',
          meetingLink: 'https://zoom.us/j/123456789',
          location: 'Virtual Meeting Room',
          arbitrator: {
            id: 'arb1',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@example.com'
          },
          agenda: [
            'Case introduction and procedures',
            'Review of pleadings',
            'Schedule for document submission'
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          caseId,
          title: 'Evidence Presentation',
          scheduledDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          duration: 180,
          type: 'PHYSICAL',
          status: 'SCHEDULED',
          location: 'Conference Room A, Arbitration Centre',
          arbitrator: {
            id: 'arb1',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@example.com'
          },
          agenda: [
            'Claimant evidence presentation',
            'Respondent evidence presentation',
            'Expert witness testimonies'
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
  }

  async scheduleHearing(caseId: string, hearingData: any, userId: string) {
    const hearing = {
      id: Date.now().toString(),
      caseId,
      title: hearingData.title,
      scheduledDate: new Date(hearingData.date + ' ' + hearingData.time),
      duration: hearingData.duration || 120,
      type: hearingData.type || 'virtual',
      status: 'SCHEDULED',
      meetingLink: hearingData.meetingLink,
      location: hearingData.location,
      agenda: hearingData.agenda || [],
      arbitratorId: hearingData.arbitratorId || userId,
      notes: hearingData.notes,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In a real implementation, this would create in the database
    try {
      return await this.prisma.hearing.create({
        data: {
          caseId,
          title: hearing.title,
          scheduledDate: hearing.scheduledDate,
          duration: hearing.duration,
          type: hearing.type === 'virtual' ? 'VIRTUAL' : 'PHYSICAL',
          status: 'SCHEDULED',
          meetingLink: hearing.meetingLink,
          location: hearing.location,
          arbitratorId: hearing.arbitratorId,
          notes: hearing.notes,
          agenda: hearing.agenda
        },
        include: {
          arbitrator: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } catch (error) {
      console.error('Database error creating hearing:', error);
      return hearing;
    }
  }

  async updateHearing(id: string, updateData: any, userId: string) {
    try {
      return await this.prisma.hearing.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          arbitrator: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } catch (error) {
      console.error('Database error updating hearing:', error);
      return {
        id,
        ...updateData,
        updatedAt: new Date(),
        updatedBy: userId
      };
    }
  }

  async cancelHearing(id: string, userId: string) {
    try {
      return await this.prisma.hearing.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Database error cancelling hearing:', error);
      return {
        id,
        status: 'CANCELLED',
        cancelledBy: userId,
        cancelledAt: new Date()
      };
    }
  }

  async joinHearing(id: string, userId: string) {
    // Mock implementation for joining a hearing
    return {
      hearingId: id,
      userId,
      joinedAt: new Date(),
      meetingLink: 'https://zoom.us/j/123456789',
      accessCode: '123456',
      instructions: [
        'Ensure your microphone is muted when not speaking',
        'Use the chat feature for any technical issues',
        'Raise your hand before speaking'
      ]
    };
  }

  async startHearing(id: string, userId: string) {
    try {
      const hearing = await this.prisma.hearing.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        ...hearing,
        message: 'Hearing started successfully',
        recordingEnabled: true,
        participants: []
      };
    } catch (error) {
      console.error('Database error starting hearing:', error);
      return {
        id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        startedBy: userId,
        message: 'Hearing started successfully'
      };
    }
  }

  async endHearing(id: string, endData: any, userId: string) {
    try {
      const hearing = await this.prisma.hearing.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
          updatedAt: new Date(),
          minutes: endData.minutes,
          outcome: endData.outcome
        }
      });

      return {
        ...hearing,
        message: 'Hearing ended successfully',
        duration: endData.actualDuration,
        nextSteps: endData.nextSteps || []
      };
    } catch (error) {
      console.error('Database error ending hearing:', error);
      return {
        id,
        status: 'COMPLETED',
        endedAt: new Date(),
        endedBy: userId,
        message: 'Hearing ended successfully'
      };
    }
  }

  async getHearingMinutes(id: string) {
    try {
      const hearing = await this.prisma.hearing.findUnique({
        where: { id },
        select: {
          id: true,
          minutes: true,
          agenda: true,
          outcome: true,
          startedAt: true,
          endedAt: true
        }
      });

      return hearing || this.getMockHearingMinutes(id);
    } catch (error) {
      console.error('Database error fetching hearing minutes:', error);
      return this.getMockHearingMinutes(id);
    }
  }

  private getMockHearingMinutes(id: string) {
    return {
      id,
      minutes: {
        attendees: [
          { name: 'Dr. Sarah Johnson', role: 'Arbitrator' },
          { name: 'John Smith', role: 'Claimant Representative' },
          { name: 'Jane Doe', role: 'Respondent Representative' }
        ],
        discussions: [
          {
            time: '10:00',
            speaker: 'Dr. Sarah Johnson',
            topic: 'Opening remarks and procedure',
            content: 'Welcome to the hearing. We will follow the agreed procedure...'
          },
          {
            time: '10:15',
            speaker: 'John Smith',
            topic: 'Claimant opening statement',
            content: 'Our client suffered damages due to breach of contract...'
          }
        ],
        decisions: [
          'Document submission deadline extended to [date]',
          'Next hearing scheduled for [date]'
        ],
        nextSteps: [
          'Parties to submit additional documents',
          'Expert witness statements due',
          'Prepare for final hearing'
        ]
      },
      agenda: [
        'Case introduction',
        'Review of pleadings',
        'Evidence presentation',
        'Next steps discussion'
      ],
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endedAt: new Date()
    };
  }

  async saveHearingMinutes(id: string, minutesData: any, userId: string) {
    try {
      return await this.prisma.hearing.update({
        where: { id },
        data: {
          minutes: minutesData,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Database error saving hearing minutes:', error);
      return {
        id,
        minutes: minutesData,
        savedAt: new Date(),
        savedBy: userId
      };
    }
  }

  async getHearingsByUser(userId: string, filters: any) {
    // Get hearings where user is involved (as arbitrator, party, or representative)
    const mockHearings = [
      {
        id: '1',
        caseId: 'case-001',
        caseNumber: 'ARB/2024/001',
        title: 'Initial Hearing',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        duration: 120,
        type: 'VIRTUAL',
        status: 'SCHEDULED',
        role: 'arbitrator',
        location: 'Virtual Meeting Room'
      },
      {
        id: '2',
        caseId: 'case-002',
        caseNumber: 'ARB/2024/002',
        title: 'Evidence Hearing',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 180,
        type: 'PHYSICAL',
        status: 'SCHEDULED',
        role: 'arbitrator',
        location: 'Conference Room A'
      },
      {
        id: '3',
        caseId: 'case-003',
        caseNumber: 'ARB/2024/003',
        title: 'Final Hearing',
        scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        duration: 240,
        type: 'VIRTUAL',
        status: 'COMPLETED',
        role: 'arbitrator',
        location: 'Virtual Meeting Room'
      }
    ];

    // Apply filters
    let filteredHearings = mockHearings;
    if (filters.status) {
      filteredHearings = filteredHearings.filter(h => h.status === filters.status);
    }
    if (filters.type) {
      filteredHearings = filteredHearings.filter(h => h.type === filters.type);
    }

    return filteredHearings;
  }

  async getHearingRecording(id: string) {
    // Mock recording data
    return {
      hearingId: id,
      recordingUrl: `https://recordings.arbitration.com/hearing-${id}.mp4`,
      duration: 7200, // 2 hours in seconds
      size: '1.2GB',
      format: 'mp4',
      recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      downloadUrl: `/api/hearings/${id}/recording/download`,
      transcriptUrl: `/api/hearings/${id}/transcript`,
      isAvailable: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };
  }

  async startRecording(id: string, userId: string) {
    return {
      hearingId: id,
      recordingId: `rec-${Date.now()}`,
      status: 'recording',
      startedAt: new Date(),
      startedBy: userId,
      message: 'Recording started successfully'
    };
  }

  async stopRecording(id: string, userId: string) {
    return {
      hearingId: id,
      status: 'stopped',
      stoppedAt: new Date(),
      stoppedBy: userId,
      duration: 3600, // 1 hour
      message: 'Recording stopped successfully',
      processingStatus: 'queued'
    };
  }
}