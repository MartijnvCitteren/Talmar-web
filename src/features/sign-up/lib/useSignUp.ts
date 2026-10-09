import { useCallback, useState } from 'react';
import { accountApi, saveSignupSession } from '../../../entities/account';
import type { SignUpRequest, SignUpResponse } from '../../../entities/account';

const GENERIC_ERROR = 'Er ging iets mis aan onze kant — probeer het zo weer.';

export interface UseSignUpResult {
  /** Resolves with the created account, or `undefined` when it failed (see `error`). */
  submit: (body: SignUpRequest) => Promise<SignUpResponse | undefined>;
  submitting: boolean;
  error: string | undefined;
}

export function useSignUp(): UseSignUpResult {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = useCallback(async (body: SignUpRequest) => {
    setSubmitting(true);
    setError(undefined);
    try {
      const response = await accountApi.signUp(body);
      saveSignupSession({ accountId: response.accountId, firstName: body.firstName });
      return response;
    } catch {
      // TODO(signup-api): map contract errors (e.g. email already registered) to their own copy.
      setError(GENERIC_ERROR);
      return undefined;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting, error };
}
