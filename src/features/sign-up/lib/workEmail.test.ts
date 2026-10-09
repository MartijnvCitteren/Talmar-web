import { describe, expect, it } from 'vitest';
import { validateWorkEmail } from './workEmail';

describe('validateWorkEmail', () => {
  it('accepts an address on a company domain', () => {
    expect(validateWorkEmail('sanne@bedrijf.nl')).toBeNull();
    expect(validateWorkEmail('  Sanne.de.Vries@Bedrijf.NL ')).toBeNull();
  });

  it.each(['sanne@gmail.com', 'sanne@HOTMAIL.com', 'sanne@outlook.nl', 'sanne@ziggo.nl'])(
    'refuses the personal mailbox %s',
    (email) => {
      expect(validateWorkEmail(email)).toBe('personal-domain');
    },
  );

  it.each(['sanne', 'sanne@', 'sanne@bedrijf', '@bedrijf.nl', 'san ne@bedrijf.nl'])(
    'flags the malformed address %s',
    (email) => {
      expect(validateWorkEmail(email)).toBe('invalid');
    },
  );
});
