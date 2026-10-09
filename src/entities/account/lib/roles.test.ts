import { describe, expect, it } from 'vitest';
import { isAccountRole, roleOptions } from './roles';

describe('roleOptions', () => {
  it('lists the four roles in the order of the design', () => {
    expect(roleOptions.map((option) => option.label)).toEqual([
      'Owner',
      'Hiring Manager',
      'HR-Manager',
      'Recruiter',
    ]);
  });
});

describe('isAccountRole', () => {
  it('accepts a known role and rejects anything else', () => {
    expect(isAccountRole('RECRUITER')).toBe(true);
    expect(isAccountRole('')).toBe(false);
    expect(isAccountRole('CEO')).toBe(false);
  });
});
