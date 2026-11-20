import { describe, expect, it } from 'vitest';
import { companyFromEmail } from './company-from-email';

describe('companyFromEmail', () => {
  it.each([
    ['sanne@acme-logistics.nl', 'Acme-logistics'],
    ['Sanne@ACME.com', 'Acme'],
    ['jo@mail.acme.co.uk', 'Acme'],
    ['jo@acme.co.uk', 'Acme'],
    ['jo@hr.bakkerij-de-vries.nl', 'Bakkerij-de-vries'],
  ])('%s → %s', (email, company) => {
    expect(companyFromEmail(email)).toBe(company);
  });

  it.each(['', 'sanne', 'sanne@', 'sanne@bedrijf', 'sanne@bedrijf.'])('nothing yet for "%s"', (email) => {
    expect(companyFromEmail(email)).toBeUndefined();
  });
});
