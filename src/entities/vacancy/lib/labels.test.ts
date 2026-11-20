import { describe, expect, it } from 'vitest';
import { categoryOptions, currencyOptions, languageOptions, salaryPeriodOptions, workplaceTypeOptions } from './labels';

describe('categoryOptions', () => {
  it('has one Dutch-labelled option per API VacancyCategory value (21 total)', () => {
    expect(categoryOptions).toHaveLength(21);
    for (const option of categoryOptions) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });
});

describe('workplaceTypeOptions', () => {
  it('has one option per WorkplaceType value', () => {
    expect(workplaceTypeOptions.map((o) => o.value).sort()).toEqual(['HYBRID', 'ONSITE', 'REMOTE']);
  });
});

describe('salaryPeriodOptions', () => {
  it('has exactly the 3 API enum values, no DAILY', () => {
    expect(salaryPeriodOptions.map((o) => o.value).sort()).toEqual(['ANNUAL', 'HOURLY', 'MONTHLY']);
  });
});

describe('languageOptions', () => {
  it('has one Dutch-labelled option per API Language value, Dutch first', () => {
    expect(languageOptions.map((o) => o.value)).toEqual(['NL', 'EN', 'DE', 'FR']);
    expect(languageOptions[0].label).toBe('Nederlands');
  });
});

describe('currencyOptions', () => {
  it('offers every API CurrencyCode once, euro first', () => {
    const values = currencyOptions.map((o) => o.value);
    expect(values[0]).toBe('EUR');
    expect(new Set(values).size).toBe(17);
  });
});
