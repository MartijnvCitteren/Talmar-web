import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STUB_VERIFY_AFTER_MS, stubAccountApi } from './stubAccountApi';

const request = { firstName: 'Sanne', lastName: 'de Vries', email: 'sanne@bedrijf.nl', role: 'RECRUITER' } as const;

async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return promise;
}

describe('stubAccountApi', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('creates a pending account', async () => {
    const response = await settle(stubAccountApi.signUp(request));

    expect(response.verificationStatus).toBe('PENDING');
    expect(response.accountId).toMatch(/^stub-account-\d+$/);
  });

  it('reports the account as verified once the stub delay has passed', async () => {
    const { accountId } = await settle(stubAccountApi.signUp(request));

    expect(await settle(stubAccountApi.getVerificationStatus(accountId))).toBe('PENDING');

    vi.advanceTimersByTime(STUB_VERIFY_AFTER_MS);
    expect(await settle(stubAccountApi.getVerificationStatus(accountId))).toBe('VERIFIED');
  });

  it('keeps an unknown account id pending', async () => {
    expect(await settle(stubAccountApi.getVerificationStatus('someone-else'))).toBe('PENDING');
  });
});
