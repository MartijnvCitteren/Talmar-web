import { httpClient } from '../../../shared/api';
import type { JobRole, OnboardingResponse } from '../model/types';

export const accountApi = {
  /**
   * `POST /onboarding`: gives the logged-in account its Taldo user and company. Names and
   * e-mail come from the verified account; only the job role is sent. Safe to repeat.
   */
  onboard(jobRole: JobRole): Promise<OnboardingResponse> {
    return httpClient.post<OnboardingResponse>('/onboarding', { jobRole });
  },
};
