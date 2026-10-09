import type { AccountApi } from './accountApi';

/** How long after signup the stub reports the account as verified, so the flow can be clicked through end-to-end. */
export const STUB_VERIFY_AFTER_MS = 5000;
const STUB_LATENCY_MS = 400;
const ID_PREFIX = 'stub-account-';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stand-in for the not-yet-specified signup API. The creation time is encoded in the
 * account id, so "verification" survives a page reload without any stored state.
 */
export const stubAccountApi: AccountApi = {
  async signUp() {
    await delay(STUB_LATENCY_MS);
    return { accountId: `${ID_PREFIX}${Date.now()}`, verificationStatus: 'PENDING' };
  },
  async getVerificationStatus(accountId) {
    await delay(STUB_LATENCY_MS);
    const createdAt = Number(accountId.slice(ID_PREFIX.length));
    if (!accountId.startsWith(ID_PREFIX) || Number.isNaN(createdAt)) {
      return 'PENDING';
    }
    return Date.now() - createdAt >= STUB_VERIFY_AFTER_MS ? 'VERIFIED' : 'PENDING';
  },
  async resendVerification() {
    await delay(STUB_LATENCY_MS);
  },
};
