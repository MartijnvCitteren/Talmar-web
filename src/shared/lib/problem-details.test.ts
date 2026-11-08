import { describe, expect, it } from 'vitest';
import { DEFAULT_FIELD_ERROR, toFieldErrors, toUserMessage } from './problem-details';

describe('toFieldErrors', () => {
  it('keys each error by its field and uses the Dutch message given for that field', () => {
    const result = toFieldErrors(
      [
        { field: 'jobTitle', message: 'size must be between 2 and 100' },
        { field: 'category', message: 'must not be null' },
      ],
      { jobTitle: 'Functietitel is verplicht.', category: 'Categorie is verplicht.' },
    );

    expect(result).toEqual({
      jobTitle: 'Functietitel is verplicht.',
      category: 'Categorie is verplicht.',
    });
  });

  it('keeps only the last segment of a nested field path', () => {
    const result = toFieldErrors(
      [
        { field: 'location.city', message: 'must not be blank' },
        { field: 'contactPerson.email', message: 'must be a well-formed email address' },
      ],
      { city: 'Stad is verplicht.' },
    );

    expect(result).toEqual({ city: 'Stad is verplicht.', email: DEFAULT_FIELD_ERROR });
  });

  it('never shows the English API message', () => {
    const result = toFieldErrors([{ field: 'jobTitle', message: 'must not be null' }]);

    expect(result).toEqual({ jobTitle: DEFAULT_FIELD_ERROR });
  });

  it('returns an empty object for undefined input', () => {
    expect(toFieldErrors(undefined)).toEqual({});
  });

  it('returns an empty object for an empty array', () => {
    expect(toFieldErrors([])).toEqual({});
  });
});

describe('toUserMessage', () => {
  it('uses the per-status override first', () => {
    expect(
      toUserMessage({ status: 409 }, { fallback: 'Mislukt.', byStatus: { 409: 'Al gepubliceerd.' } }),
    ).toBe('Al gepubliceerd.');
  });

  it('falls back to a shared message for common statuses', () => {
    expect(toUserMessage({ status: 0 }, { fallback: 'Mislukt.' })).toMatch(/server nu niet bereiken/);
    expect(toUserMessage({ status: 409 }, { fallback: 'Mislukt.' })).toMatch(/ergens anders aangepast/);
  });

  it('uses the fallback for any other status or a non-API error', () => {
    expect(toUserMessage({ status: 500 }, { fallback: 'Mislukt.' })).toBe('Mislukt.');
    expect(toUserMessage(undefined, { fallback: 'Mislukt.' })).toBe('Mislukt.');
  });
});
