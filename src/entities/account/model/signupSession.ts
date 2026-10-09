/**
 * Who just signed up, kept for the rest of the browser tab's life so the verify screen
 * knows which account to poll and the dashboard can greet by first name. Replace with the
 * real session/current-user source once auth exists.
 */
export interface SignupSession {
  accountId: string;
  firstName: string;
}

const STORAGE_KEY = 'jobzy.signup';

export function saveSignupSession(session: SignupSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked (private mode, quota): the flow still works within this page view.
  }
}

export function readSignupSession(): SignupSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SignupSession>;
    if (typeof parsed.accountId !== 'string' || typeof parsed.firstName !== 'string') return null;
    return { accountId: parsed.accountId, firstName: parsed.firstName };
  } catch {
    return null;
  }
}
