import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { accountApi } from '../../../entities/account';
import { useResendVerification } from './useResendVerification';

vi.mock('../../../entities/account', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/account')>('../../../entities/account');
  return {
    ...actual,
    accountApi: { signUp: vi.fn(), getVerificationStatus: vi.fn(), resendVerification: vi.fn() },
  };
});

describe('useResendVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('only allows a resend after the cooldown', () => {
    const { result } = renderHook(() => useResendVerification('account-1', 30_000));
    expect(result.current.canResend).toBe(false);

    act(() => vi.advanceTimersByTime(29_999));
    expect(result.current.canResend).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.canResend).toBe(true);
  });

  it('resends, confirms it, and restarts the cooldown', async () => {
    vi.mocked(accountApi.resendVerification).mockResolvedValue();
    const { result } = renderHook(() => useResendVerification('account-1', 30_000));
    act(() => vi.advanceTimersByTime(30_000));

    await act(() => result.current.resend());

    expect(accountApi.resendVerification).toHaveBeenCalledWith('account-1');
    expect(result.current.notice).toEqual({ kind: 'sent', message: 'We hebben de mail nog eens gestuurd.' });
    expect(result.current.canResend).toBe(false);
  });

  it('reports a failed resend calmly and keeps the button available', async () => {
    vi.mocked(accountApi.resendVerification).mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useResendVerification('account-1', 30_000));
    act(() => vi.advanceTimersByTime(30_000));

    await act(() => result.current.resend());

    expect(result.current.notice).toEqual({
      kind: 'error',
      message: 'Opnieuw sturen lukte niet — probeer het zo weer.',
    });
    expect(result.current.canResend).toBe(true);
  });
});
