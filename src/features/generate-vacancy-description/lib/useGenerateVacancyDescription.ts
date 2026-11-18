import { useCallback, useRef, useState } from 'react';
import { descriptionApi, type VacancyDescriptionResponse } from '../../../entities/vacancy-description';
import { pollUntil } from '../../../shared/lib/polling';
import type { ApiError } from '../../../shared/api';
import { toUserMessage } from '../../../shared/lib/problem-details';

export type GenerationPhase = 'idle' | 'generating' | 'ready' | 'failed';

export interface GenerateVacancyDescriptionInputs {
  mostImportantTasks: string;
  team: string;
  whyNiceJob: string;
}

export type RegeneratableSection = 'summary' | 'jobDescription' | 'tasks';

const POLL_INTERVAL_MS = 2000;
/**
 * The API gives up on a generation after 90 seconds and then answers the poll with a `500`, so
 * polling a little longer than that always ends in an answer from the API rather than a guess.
 */
const POLL_TIMEOUT_MS = 100_000;

export const GENERATION_FAILED_MESSAGE =
  'Het opstellen van je vacaturetekst is niet gelukt. Probeer het opnieuw, of schrijf de tekst zelf.';

/**
 * The poll answers a failed generation with a problem response; each status asks something
 * different of the recruiter (contract: `GET /vacancy/{id}/generate-description/{generationId}`).
 */
const generationFailureMessages: Record<number, string> = {
  // The inputs were rejected as not describing a job: retrying the same answers won't help.
  422: 'Uit je antwoorden konden we geen vacaturetekst maken. Schrijf de tekst zelf, of probeer het opnieuw met concretere antwoorden over de functie.',
  // The AI provider refuses in a way a retry won't fix.
  503: 'Het opstellen met AI is op dit moment niet beschikbaar. Je kunt de tekst zelf schrijven.',
  // The draft is kept for 32 hours.
  404: 'Je concepttekst is verlopen. Probeer het opnieuw, of schrijf de tekst zelf.',
  500: GENERATION_FAILED_MESSAGE,
};

export function useGenerateVacancyDescription(vacancyId: string) {
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [result, setResult] = useState<VacancyDescriptionResponse | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const lastInputs = useRef<GenerateVacancyDescriptionInputs | undefined>(undefined);

  const runGeneration = useCallback(
    async (inputs: GenerateVacancyDescriptionInputs) => {
      setError(undefined);
      setPhase('generating');
      lastInputs.current = inputs;
      try {
        const started = await descriptionApi.generateDescription(vacancyId, inputs);
        const generation = await pollUntil(
          () => descriptionApi.getGenerationStatus(vacancyId, started.generationId),
          (status) => status.status === 'COMPLETED' || status.status === 'FAILED',
          { intervalMs: POLL_INTERVAL_MS, timeoutMs: POLL_TIMEOUT_MS },
        );

        if (generation.status === 'FAILED' || !generation.description) {
          setError(GENERATION_FAILED_MESSAGE);
          setPhase('failed');
          return;
        }

        setResult(generation.description);
        setPhase('ready');
      } catch (caught) {
        // A poll timeout is a plain Error without a status: treated like any other failure.
        const apiError = caught as Partial<ApiError>;
        setError(
          toUserMessage(apiError, { fallback: GENERATION_FAILED_MESSAGE, byStatus: generationFailureMessages }),
        );
        setPhase('failed');
      }
    },
    [vacancyId],
  );

  const start = useCallback(
    (inputs: GenerateVacancyDescriptionInputs) => runGeneration(inputs),
    [runGeneration],
  );

  const regenerate = useCallback(
    async (section: RegeneratableSection) => {
      if (!lastInputs.current) return;
      const previous = result;
      await runGeneration(lastInputs.current);
      setResult((current) => {
        if (!current) return current;
        if (!previous) return current;
        return { ...previous, [section]: current[section] };
      });
    },
    [runGeneration, result],
  );

  return { phase, result, error, start, regenerate };
}
