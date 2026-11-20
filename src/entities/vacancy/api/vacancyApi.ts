import { httpClient } from '../../../shared/api';
import type {
  ContactPerson,
  Offer,
  VacancyCoreRequest,
  VacancyResponse,
  VacancyTransitionAction,
} from '../model/types';

/**
 * The core section as `PATCH /vacancy/{id}` accepts it: the same fields as on creation.
 * `minHoursPerWeek` and `maxHoursPerWeek` must be sent together, so both are required here.
 */
export type VacancyCorePatch = VacancyCoreRequest;

/**
 * Contact person and offer as `PATCH /vacancy/{id}` accepts them. Each section is replaced as a
 * whole; an omitted section is left untouched.
 */
export interface VacancyContactOfferPatch {
  contactPerson?: ContactPerson;
  offer?: Offer;
}

export const vacancyApi = {
  createVacancy(body: VacancyCoreRequest): Promise<VacancyResponse> {
    return httpClient.post<VacancyResponse>('/vacancy', body);
  },
  patchVacancyCore(id: string, body: VacancyCorePatch): Promise<VacancyResponse> {
    return httpClient.patch<VacancyResponse>(`/vacancy/${id}`, body);
  },
  patchVacancyContactOffer(id: string, body: VacancyContactOfferPatch): Promise<VacancyResponse> {
    return httpClient.patch<VacancyResponse>(`/vacancy/${id}`, body);
  },
  transitionVacancy(id: string, action: VacancyTransitionAction): Promise<VacancyResponse> {
    return httpClient.post<VacancyResponse>(`/vacancy/${id}/transitions`, { action });
  },
  publishVacancy(id: string): Promise<VacancyResponse> {
    return vacancyApi.transitionVacancy(id, 'PUBLISH');
  },
};
