import { beforeEach, describe, expect, it } from 'vitest';
import { readSignupSession, saveSignupSession } from './signupSession';

describe('signupSession', () => {
  beforeEach(() => sessionStorage.clear());

  it('round-trips a saved session', () => {
    saveSignupSession({ accountId: 'account-1', firstName: 'Sanne' });

    expect(readSignupSession()).toEqual({ accountId: 'account-1', firstName: 'Sanne' });
  });

  it('returns null when nothing was saved', () => {
    expect(readSignupSession()).toBeNull();
  });

  it('returns null for malformed storage instead of throwing', () => {
    sessionStorage.setItem('jobzy.signup', '{not json');
    expect(readSignupSession()).toBeNull();

    sessionStorage.setItem('jobzy.signup', JSON.stringify({ accountId: 42 }));
    expect(readSignupSession()).toBeNull();
  });
});
