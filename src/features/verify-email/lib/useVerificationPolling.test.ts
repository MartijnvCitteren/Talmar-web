import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { accountApi } from '../../../entities/account';
import { useVerificationPolling } from './useVerificationPolling';

vi.mock('../../../entities/account', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/account')>('../../../entities/account');
  return {
    ...actual,
    accountApi: { signUp: vi.fn(), getVerificationStatus: vi.fn(), resendVerification: vi.fn() },
  };
});

describe('useVerificationPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('keeps polling until the account is verified, then calls onVerified once', async () => {
    vi.mocked(accountApi.getVerificationStatus)
      .mockResolvedValueOnce('PENDING')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce('VERIFIED');
    const onVerified = vi.fn();

    renderHook(() => useVerificationPolling('account-1', onVerified, 1000));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(onVerified).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(accountApi.getVerificationStatus).toHaveBeenCalledTimes(3);
    expect(accountApi.getVerificationStatus).toHaveBeenCalledWith('account-1');
    expect(onVerified).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(accountApi.getVerificationStatus).toHaveBeenCalledTimes(3);
  });

  it('stops polling on unmount', async () => {
    vi.mocked(accountApi.getVerificationStatus).mockResolvedValue('PENDING');

    const { unmount } = renderHook(() => useVerificationPolling('account-1', vi.fn(), 1000));
    await act(() => vi.advanceTimersByTimeAsync(0));
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(5000));

    expect(accountApi.getVerificationStatus).toHaveBeenCalledTimes(1);
  });
});
