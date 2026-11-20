import { useCallback, useState } from 'react';
import { accountApi, type AccountStatus, type JobRole } from '../../../entities/account';
import type { ApiError } from '../../../shared/api';
import { toUserMessage } from '../../../shared/lib/problem-details';

/** What the app shows next: the account's status, or that onboarding had already happened. */
export type OnboardingOutcome = AccountStatus | 'ALREADY_ONBOARDED';

/**
 * Calls `POST /onboarding` with the chosen job role. A `409` means onboarding already happened
 * (e.g. a second tab): not an error, the user just goes on. Every other failure becomes a calm
 * Dutch message; a `503` asks to try again, which the API says finishes a half-done onboarding.
 */
export function useOnboardAccount() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const onboard = useCallback(async (jobRole: JobRole): Promise<OnboardingOutcome | undefined> => {
    setError(undefined);
    setSubmitting(true);
    try {
      const { status } = await accountApi.onboard(jobRole);
      return status;
    } catch (caught) {
      const apiError = caught as ApiError;
      if (apiError.status === 409) {
        return 'ALREADY_ONBOARDED';
      }
      setError(
        toUserMessage(apiError, {
          fallback: 'Je account afronden lukte niet. Probeer het zo nog een keer.',
          byStatus: {
            401: 'Je bent niet meer ingelogd. Log opnieuw in, dan kies je daarna je rol.',
            403: 'Met dit account kun je Taldo niet gebruiken: dat kan alleen met een bevestigd werkmailadres.',
            503: 'Je account is nog niet helemaal afgerond. Probeer het nog een keer; je keuze staat nog klaar.',
          },
        }),
      );
      return undefined;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { onboard, submitting, error };
}
