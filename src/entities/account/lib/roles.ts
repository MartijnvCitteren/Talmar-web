import type { AccountRole } from '../model/types';

export const roleLabels: Record<AccountRole, string> = {
  OWNER: 'Owner',
  HIRING_MANAGER: 'Hiring Manager',
  HR_MANAGER: 'HR-Manager',
  RECRUITER: 'Recruiter',
};

export const roleOptions: { value: AccountRole; label: string }[] = (
  Object.keys(roleLabels) as AccountRole[]
).map((value) => ({ value, label: roleLabels[value] }));

export function isAccountRole(value: string): value is AccountRole {
  return value in roleLabels;
}
