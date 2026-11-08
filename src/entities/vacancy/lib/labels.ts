import type { CurrencyCode, Language, SalaryPeriod, VacancyCategory, WorkplaceType } from '../model/types';

/**
 * Flat Dutch labels for the API's 21-value VacancyCategory enum (source of truth per the
 * plan — not the design note's 13-value grouped display; see specs/open-questions.md #3).
 */
export const categoryLabels: Record<VacancyCategory, string> = {
  ADMINISTRATION: 'Administratie',
  CONSTRUCTION: 'Bouw',
  CUSTOMER_SUPPORT: 'Klantenservice',
  DESIGN_CREATIVE: 'Design & creatief',
  EDUCATION: 'Onderwijs',
  ENGINEERING: 'Engineering',
  FACILITY_SERVICES: 'Facilitaire dienstverlening',
  FINANCE: 'Finance',
  HEALTHCARE: 'Zorg',
  HOSPITALITY: 'Horeca',
  HUMAN_RESOURCES: 'HR',
  LEGAL: 'Juridisch',
  LOGISTICS_SUPPLY_CHAIN: 'Logistiek & supply chain',
  MANAGEMENT: 'Management',
  MARKETING: 'Marketing',
  OPERATIONS: 'Operations',
  PRODUCTION_MANUFACTURING: 'Productie & fabricage',
  RETAIL: 'Retail',
  SALES: 'Sales',
  SCIENCE_RESEARCH: 'Wetenschap & onderzoek',
  OTHER: 'Overig',
};

export const categoryOptions = (Object.keys(categoryLabels) as VacancyCategory[]).map((value) => ({
  value,
  label: categoryLabels[value],
}));

export const workplaceTypeLabels: Record<WorkplaceType, string> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybride',
  REMOTE: 'Remote',
};

export const workplaceTypeOptions = (Object.keys(workplaceTypeLabels) as WorkplaceType[]).map((value) => ({
  value,
  label: workplaceTypeLabels[value],
}));

/**
 * Built from the real 3-value API enum (HOURLY/MONTHLY/ANNUAL) — no DAILY, unlike the
 * design notes' 4-option mockup. See specs/open-questions.md #2.
 */
export const salaryPeriodLabels: Record<SalaryPeriod, string> = {
  HOURLY: 'Per uur',
  MONTHLY: 'Per maand',
  ANNUAL: 'Per jaar',
};

export const salaryPeriodOptions = (Object.keys(salaryPeriodLabels) as SalaryPeriod[]).map((value) => ({
  value,
  label: salaryPeriodLabels[value],
}));

/** The language the vacancy texts are written in; also the language AI drafts are generated in. */
export const languageLabels: Record<Language, string> = {
  NL: 'Nederlands',
  EN: 'Engels',
  DE: 'Duits',
  FR: 'Frans',
};

export const languageOptions = (Object.keys(languageLabels) as Language[]).map((value) => ({
  value,
  label: languageLabels[value],
}));

/**
 * Every currency the API accepts (`CurrencyCode`), euro first, then by how often Talmar's
 * markets use them. Shown as the ISO code, which is how recruiters know them.
 */
export const currencyCodes: CurrencyCode[] = [
  'EUR',
  'GBP',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'HUF',
  'RON',
  'ISK',
  'ALL',
  'BAM',
  'MKD',
  'MDL',
  'RSD',
  'UAH',
];

export const currencyOptions = currencyCodes.map((value) => ({ value, label: value }));
