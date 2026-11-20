/** Second-level labels under which the registrable name sits one label deeper (acme.co.uk). */
const SECOND_LEVEL = new Set(['co', 'com', 'org', 'net', 'ac', 'gov', 'edu']);

/**
 * The company name Taldo starts a new company with, derived from a work e-mail address the
 * way the API does it (IdentityApi.yml, Onboarding): the registrable label of the domain,
 * capitalised. `sanne@acme-logistics.nl` → `Acme-logistics`, `jo@mail.acme.co.uk` → `Acme`.
 * Only a preview: the API decides, and the company's users can correct the name later.
 * Returns undefined while the address has no usable domain yet.
 */
export function companyFromEmail(email: string): string | undefined {
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain) {
    return undefined;
  }
  const labels = domain.split('.').filter(Boolean);
  if (labels.length < 2) {
    return undefined;
  }
  const tld = labels[labels.length - 1];
  const second = labels[labels.length - 2];
  const registrable =
    labels.length >= 3 && tld.length === 2 && SECOND_LEVEL.has(second) ? labels[labels.length - 3] : second;
  return registrable.charAt(0).toUpperCase() + registrable.slice(1);
}
