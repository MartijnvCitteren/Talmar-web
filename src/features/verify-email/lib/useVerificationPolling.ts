import { useEffect, useRef } from 'react';
import { accountApi } from '../../../entities/account';

export const VERIFICATION_POLL_INTERVAL_MS = 3000;

/**
 * Polls the account's verification status while mounted and calls `onVerified` once.
 * A failed poll is treated as "not yet" — the next tick simply tries again.
 */
export function useVerificationPolling(
  accountId: string,
  onVerified: () => void,
  intervalMs = VERIFICATION_POLL_INTERVAL_MS,
): void {
  const onVerifiedRef = useRef(onVerified);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const status = await accountApi.getVerificationStatus(accountId);
        if (cancelled) return;
        if (status === 'VERIFIED') {
          onVerifiedRef.current();
          return;
        }
      } catch {
        if (cancelled) return;
      }
      timer = setTimeout(tick, intervalMs);
    }

    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [accountId, intervalMs]);
}
