import { useCallback, useEffect, useState } from 'react';
import { accountApi } from '../../../entities/account';

export const RESEND_COOLDOWN_MS = 30_000;

export interface UseResendVerificationResult {
  /** False during the cooldown after landing on the page or after a resend. */
  canResend: boolean;
  resending: boolean;
  resend: () => Promise<void>;
  /** Outcome of the last resend, for a polite status line. */
  notice: { kind: 'sent' | 'error'; message: string } | undefined;
}

export function useResendVerification(
  accountId: string,
  cooldownMs = RESEND_COOLDOWN_MS,
): UseResendVerificationResult {
  const [cooldownRound, setCooldownRound] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<UseResendVerificationResult['notice']>();

  useEffect(() => {
    setCanResend(false);
    const timer = setTimeout(() => setCanResend(true), cooldownMs);
    return () => clearTimeout(timer);
  }, [cooldownMs, cooldownRound]);

  const resend = useCallback(async () => {
    setResending(true);
    setNotice(undefined);
    try {
      await accountApi.resendVerification(accountId);
      setNotice({ kind: 'sent', message: 'We hebben de mail nog eens gestuurd.' });
      setCooldownRound((round) => round + 1);
    } catch {
      setNotice({ kind: 'error', message: 'Opnieuw sturen lukte niet — probeer het zo weer.' });
    } finally {
      setResending(false);
    }
  }, [accountId]);

  return { canResend, resending, resend, notice };
}
