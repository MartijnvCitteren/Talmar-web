import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { accountApi, readSignupSession } from '../../../entities/account';
import type { SignUpRequest } from '../../../entities/account';
import { useSignUp } from './useSignUp';

vi.mock('../../../entities/account', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/account')>('../../../entities/account');
  return {
    ...actual,
    accountApi: { signUp: vi.fn(), getVerificationStatus: vi.fn(), resendVerification: vi.fn() },
  };
});

const request: SignUpRequest = {
  firstName: 'Sanne',
  lastName: 'de Vries',
  email: 'sanne@bedrijf.nl',
  role: 'RECRUITER',
};

describe('useSignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('creates the account and remembers who signed up', async () => {
    vi.mocked(accountApi.signUp).mockResolvedValue({ accountId: 'account-1', verificationStatus: 'PENDING' });
    const { result } = renderHook(() => useSignUp());

    let response;
    await act(async () => {
      response = await result.current.submit(request);
    });

    expect(accountApi.signUp).toHaveBeenCalledWith(request);
    expect(response).toEqual({ accountId: 'account-1', verificationStatus: 'PENDING' });
    expect(readSignupSession()).toEqual({ accountId: 'account-1', firstName: 'Sanne' });
    expect(result.current.error).toBeUndefined();
    expect(result.current.submitting).toBe(false);
  });

  it('shows a calm error and resolves undefined when the call fails', async () => {
    vi.mocked(accountApi.signUp).mockRejectedValue({ status: 500, title: 'boom' });
    const { result } = renderHook(() => useSignUp());

    let response;
    await act(async () => {
      response = await result.current.submit(request);
    });

    expect(response).toBeUndefined();
    expect(result.current.error).toBe('Er ging iets mis aan onze kant — probeer het zo weer.');
    expect(readSignupSession()).toBeNull();
  });
});
