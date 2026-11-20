import { describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api';
import { vacancyApi } from './vacancyApi';
import type { VacancyCoreRequest, VacancyResponse } from '../model/types';

vi.mock('../../../shared/api', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const vacancy: VacancyResponse = {
  id: '00000000-0000-0000-0000-000000000001',
  status: 'DRAFT',
  jobTitle: 'Senior Backend Developer',
  category: 'ENGINEERING',
  location: { country: 'NL', city: 'Amsterdam' },
  workplaceType: 'HYBRID',
  minHoursPerWeek: 24,
  maxHoursPerWeek: 36,
  createdAt: '2026-09-19T00:00:00Z',
} as unknown as VacancyResponse;

describe('vacancyApi', () => {
  it('createVacancy POSTs to /vacancy with the core request body', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(vacancy);
    const body: VacancyCoreRequest = {
      jobTitle: 'Senior Backend Developer',
      language: 'NL',
      category: 'ENGINEERING',
      location: { country: 'NL', city: 'Amsterdam' },
      workplaceType: 'HYBRID',
      minHoursPerWeek: 24,
      maxHoursPerWeek: 36,
    };

    const result = await vacancyApi.createVacancy(body);

    expect(httpClient.post).toHaveBeenCalledWith('/vacancy', body);
    expect(result).toEqual(vacancy);
  });

  it('patchVacancyCore PATCHes /vacancy/{id} with the core fields, hours included', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(vacancy);
    const body = {
      jobTitle: 'Updated title',
      language: 'EN' as const,
      category: 'ENGINEERING' as const,
      location: { country: 'NL', city: 'Utrecht' },
      workplaceType: 'REMOTE' as const,
      minHoursPerWeek: 32,
      maxHoursPerWeek: 40,
    };

    const result = await vacancyApi.patchVacancyCore('vacancy-1', body);

    expect(httpClient.patch).toHaveBeenCalledWith('/vacancy/vacancy-1', body);
    expect(result).toEqual(vacancy);
  });

  it('patchVacancyContactOffer PATCHes /vacancy/{id} with only contactPerson and offer', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(vacancy);

    const body = {
      contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
      offer: { salaryMin: 3000, salaryMax: 4000, currency: 'EUR' as const, salaryPeriod: 'MONTHLY' as const },
    };

    const result = await vacancyApi.patchVacancyContactOffer('vacancy-1', body);

    expect(httpClient.patch).toHaveBeenCalledWith('/vacancy/vacancy-1', body);
    expect(result).toEqual(vacancy);
  });

  it('publishVacancy POSTs a PUBLISH action to /vacancy/{id}/transitions', async () => {
    const published = { ...vacancy, status: 'PUBLISHED' } as unknown as VacancyResponse;
    vi.mocked(httpClient.post).mockResolvedValue(published);

    const result = await vacancyApi.publishVacancy('vacancy-1');

    expect(httpClient.post).toHaveBeenCalledWith('/vacancy/vacancy-1/transitions', { action: 'PUBLISH' });
    expect(result).toEqual(published);
  });
});
