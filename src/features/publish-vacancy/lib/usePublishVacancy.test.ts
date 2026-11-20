import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { vacancyApi } from '../../../entities/vacancy';
import { usePublishVacancy } from './usePublishVacancy';
import type { VacancyResponse } from '../../../entities/vacancy';

vi.mock('../../../entities/vacancy', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/vacancy')>('../../../entities/vacancy');
  return {
    ...actual,
    vacancyApi: {
      createVacancy: vi.fn(),
      patchVacancyCore: vi.fn(),
      patchVacancyContactOffer: vi.fn(),
      publishVacancy: vi.fn(),
    },
  };
});

describe('usePublishVacancy', () => {
  it('calls vacancyApi.publishVacancy and returns the published vacancy', async () => {
    const published = { id: 'vacancy-1', status: 'PUBLISHED' } as unknown as VacancyResponse;
    vi.mocked(vacancyApi.publishVacancy).mockResolvedValue(published);

    const { result } = renderHook(() => usePublishVacancy());

    let returned: VacancyResponse | undefined;
    await act(async () => {
      returned = await result.current.publish('vacancy-1');
    });

    expect(vacancyApi.publishVacancy).toHaveBeenCalledWith('vacancy-1');
    expect(returned).toEqual(published);
    expect(result.current.publishing).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('sets publishing while in flight', async () => {
    let resolvePromise: (value: VacancyResponse) => void = () => {};
    vi.mocked(vacancyApi.publishVacancy).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => usePublishVacancy());

    let publishPromise: Promise<VacancyResponse>;
    act(() => {
      publishPromise = result.current.publish('vacancy-1');
    });

    await waitFor(() => expect(result.current.publishing).toBe(true));

    await act(async () => {
      resolvePromise({ id: 'vacancy-1' } as unknown as VacancyResponse);
      await publishPromise;
    });

    expect(result.current.publishing).toBe(false);
  });

  it('surfaces a 409 conflict as a visible error and rethrows', async () => {
    vi.mocked(vacancyApi.publishVacancy).mockRejectedValue({
      status: 409,
      title: 'Vacancy cannot be published in its current state.',
    });

    const { result } = renderHook(() => usePublishVacancy());

    await act(async () => {
      await expect(result.current.publish('vacancy-1')).rejects.toBeDefined();
    });

    expect(result.current.error).toMatch(/kan nu niet worden gepubliceerd/);
    expect(result.current.publishing).toBe(false);
  });
});
