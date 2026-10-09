/**
 * Provisional shapes for HR self-signup. The backend team has not published the API
 * contract yet — rename/reshape these once it lands; the UI only depends on `accountApi`.
 */
export type AccountRole = 'OWNER' | 'HIRING_MANAGER' | 'HR_MANAGER' | 'RECRUITER';

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: AccountRole;
}

export type VerificationStatus = 'PENDING' | 'VERIFIED';

export interface SignUpResponse {
  accountId: string;
  verificationStatus: VerificationStatus;
}
