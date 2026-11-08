import { useCallback, useState } from 'react';
import { vacancyApi, type VacancyResponse } from '../../../entities/vacancy';
import type { ApiError } from '../../../shared/api';
import { toUserMessage } from '../../../shared/lib/problem-details';

export function usePublishVacancy() {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const publish = useCallback(async (vacancyId: string): Promise<VacancyResponse> => {
    setError(undefined);
    setPublishing(true);
    try {
      return await vacancyApi.publishVacancy(vacancyId);
    } catch (caught) {
      const apiError = caught as ApiError;
      setError(
        toUserMessage(apiError, {
          fallback: 'Publiceren is niet gelukt. Je vacature staat nog als concept klaar; probeer het zo nog eens.',
          byStatus: {
            409: 'Deze vacature kan nu niet worden gepubliceerd, bijvoorbeeld omdat hij al online staat.',
            501: 'Publiceren is nog niet beschikbaar. Je vacature staat als concept klaar.',
          },
        }),
      );
      throw caught;
    } finally {
      setPublishing(false);
    }
  }, []);

  return { publish, publishing, error };
}
