/**
 * Free/consumer mailbox domains. Signup is for companies, so these are refused client-side
 * (design note on step 3). Not exhaustive — the backend should own the authoritative check.
 */
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.nl',
  'outlook.com',
  'outlook.nl',
  'live.com',
  'live.nl',
  'msn.com',
  'yahoo.com',
  'yahoo.nl',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'ziggo.nl',
  'kpnmail.nl',
  'kpnplanet.nl',
  'planet.nl',
  'home.nl',
  'hetnet.nl',
  'xs4all.nl',
  'telfort.nl',
  'upcmail.nl',
  'chello.nl',
  'casema.nl',
  'quicknet.nl',
  'online.nl',
  'zonnet.nl',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type WorkEmailProblem = 'invalid' | 'personal-domain';

export function validateWorkEmail(email: string): WorkEmailProblem | null {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    return 'invalid';
  }
  const domain = normalized.slice(normalized.lastIndexOf('@') + 1);
  return PERSONAL_EMAIL_DOMAINS.has(domain) ? 'personal-domain' : null;
}

export const workEmailErrors: Record<WorkEmailProblem, string> = {
  invalid: 'Dit lijkt geen geldig e-mailadres — check of er een @ en een domein in staan.',
  'personal-domain': 'Dit lijkt geen werk e-mail — check je bedrijfsdomein.',
};
