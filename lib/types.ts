export enum UserRole {
  CLAIMANT = "CLAIMANT",
  RESPONDENT = "RESPONDENT",
  ARBITRATOR = "ARBITRATOR",
  ADMIN = "ADMIN"
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  expertise?: string;
  qualifications?: string;
  experience?: number;
  bio?: string;
} 