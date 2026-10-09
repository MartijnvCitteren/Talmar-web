import type { SignUpRequest, SignUpResponse, VerificationStatus } from '../model/types';
import { stubAccountApi } from './stubAccountApi';

/** The port the signup UI talks to. Swap the implementation, not the callers. */
export interface AccountApi {
  /** Creates the account and sends the verification mail. */
  signUp(body: SignUpRequest): Promise<SignUpResponse>;
  getVerificationStatus(accountId: string): Promise<VerificationStatus>;
  resendVerification(accountId: string): Promise<void>;
}

/**
 * TODO(signup-api): replace with an `httpClient`-backed implementation once the backend
 * publishes the signup contract. Until then every call is answered in-browser.
 */
export const accountApi: AccountApi = stubAccountApi;
