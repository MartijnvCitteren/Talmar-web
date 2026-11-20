import type { I18n } from './i18n';

/**
 * Sign-up, end to end (taldo-api ADR 0006): the first three steps are Keycloak pages, the
 * last one (job role, POST /onboarding) is the app's /onboarding page, which shows the same
 * steps (src/pages/onboarding).
 */
export type SignupStep = 'details' | 'verify' | 'password' | 'role';

export function signupSteps(i18n: I18n): { id: SignupStep; label: string }[] {
  const { msgStr } = i18n;
  return [
    { id: 'details', label: msgStr('signupStepDetails') },
    { id: 'verify', label: msgStr('signupStepVerify') },
    { id: 'password', label: msgStr('signupStepPassword') },
    { id: 'role', label: msgStr('signupStepRole') },
  ];
}
