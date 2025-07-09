export interface RespondentDashboardDto {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  cases: Array<{
    id: string;
    caseNumber?: string;
    name: string;
    status: string;
    responseStatus: string;
    currentPhase: string;
    responseDeadline?: Date;
    noticeServedAt: Date;
    respondedAt?: Date;
  }>;
  responses: Array<{
    id: string;
    caseId: string;
    caseNumber?: string;
    caseName: string;
    status: string;
    submittedAt?: Date;
    createdAt: Date;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: Date;
  }>;
  stats: {
    totalCases: number;
    pendingResponses: number;
    submittedResponses: number;
    unreadNotifications: number;
  };
} 