import type { JobRole } from '../model/types';

export interface JobRoleOption {
  value: JobRole;
  label: string;
  /** What someone in this role does in hiring, so people can recognise themselves. */
  description: string;
}

/** In the order they are offered: the most common role for Taldo's users first, "other" last. */
export const jobRoleOptions: JobRoleOption[] = [
  { value: 'RECRUITER', label: 'Recruiter', description: 'Je zoekt en selecteert kandidaten, vaak voor meerdere teams.' },
  { value: 'HR', label: 'HR', description: 'Werven is een van je HR-taken.' },
  { value: 'HIRING_MANAGER', label: 'Hiring manager', description: 'Je zoekt nieuwe mensen voor je eigen team.' },
  { value: 'FOUNDER_OR_DIRECTOR', label: 'Oprichter of directeur', description: 'Je neemt zelf mensen aan voor je bedrijf.' },
  { value: 'OTHER', label: 'Iets anders', description: 'Je rol staat er niet tussen.' },
];
