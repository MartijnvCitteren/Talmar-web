import { describe, expect, it } from 'vitest';
import { extractJavaPatterns, isJavaOnlyPattern, toJsRegExp } from './javaPatterns';

// Copied from the taldo-api realm's User Profile (docker/keycloak/taldo-realm.json).
const PERSON_NAME = "^(?=.*\\p{L})[\\p{L}\\p{M}'’.-]+( [\\p{L}\\p{M}'’.-]+)*$";
const WORK_EMAIL =
  '(?i)^[^@]+@(?!(?:gmail[.]com|googlemail[.]com|ziggo[.]nl|kpnmail[.]nl)$)(?!(?:outlook|hotmail|live|yahoo|aol|gmx|yandex)[.]).+$';

describe('isJavaOnlyPattern', () => {
  it('flags patterns JavaScript would misread or reject', () => {
    expect(isJavaOnlyPattern(PERSON_NAME)).toBe(true);
    expect(isJavaOnlyPattern(WORK_EMAIL)).toBe(true);
  });

  it('leaves plain patterns to Keycloakify', () => {
    expect(isJavaOnlyPattern('^[0-9]{4}$')).toBe(false);
  });
});

describe('toJsRegExp', () => {
  it('accepts real names, including accents and Dutch prefixes', () => {
    const regExp = toJsRegExp(PERSON_NAME);

    expect(regExp.test('Sanne')).toBe(true);
    expect(regExp.test('Zoë')).toBe(true);
    expect(regExp.test('de Vries')).toBe(true);
    expect(regExp.test("O'Brien")).toBe(true);
  });

  it('rejects names without letters', () => {
    expect(toJsRegExp(PERSON_NAME).test('1234')).toBe(false);
  });

  it('honours the (?i) flag: public mail domains are rejected in any case', () => {
    const regExp = toJsRegExp(WORK_EMAIL);

    expect(regExp.test('sanne@bedrijf.nl')).toBe(true);
    expect(regExp.test('sanne@gmail.com')).toBe(false);
    expect(regExp.test('sanne@GMAIL.com')).toBe(false);
    expect(regExp.test('sanne@Outlook.com')).toBe(false);
  });
});

describe('extractJavaPatterns', () => {
  const attributesByName = {
    email: {
      validators: { email: {}, pattern: { pattern: WORK_EMAIL, 'error-message': 'publicEmailDomainNotAllowed' } },
    },
    postcode: { validators: { pattern: { pattern: '^[0-9]{4}$' } } },
  };

  it('takes Java-only patterns out of the attributes and keeps the other validators', () => {
    const { attributesByName: safe } = extractJavaPatterns(attributesByName);

    expect(safe.email.validators).toEqual({ email: {} });
    expect(safe.postcode.validators).toEqual(attributesByName.postcode.validators);
  });

  it('returns them translated, with their error message key', () => {
    const { javaPatterns } = extractJavaPatterns(attributesByName);

    expect(Object.keys(javaPatterns)).toEqual(['email']);
    expect(javaPatterns.email.errorMessageKey).toBe('publicEmailDomainNotAllowed');
    expect(javaPatterns.email.regExp.test('sanne@gmail.com')).toBe(false);
  });
});
