import type { Meta, StoryObj } from '@storybook/react-vite';
import { createKcPageStory } from '../KcPageStory';

const { KcPageStory } = createKcPageStory({ pageId: 'register.ftl' });

const meta = {
  title: 'login/register.ftl',
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Keycloak's messagesPerField for a page it sent back with errors on some fields. */
function serverErrors(errors: Record<string, string>) {
  return {
    existsError: (...names: string[]) => names.some((name) => name in errors),
    get: (name: string) => errors[name] ?? '',
    exists: (name: string) => name in errors,
  };
}

const filledIn = {
  firstName: { value: 'Sanne' },
  lastName: { value: 'de Vries' },
  email: { value: 'sanne@bedrijf.nl' },
};

export const Empty: Story = {};

export const FieldErrors: Story = {
  args: {
    kcContext: {
      profile: { attributesByName: { firstName: { value: 'S4nne!' }, lastName: { value: '' } } },
      messagesPerField: serverErrors({
        firstName: 'Gebruik alleen letters, spaties, koppeltekens, apostroffen en punten.',
        lastName: 'Vul je achternaam nog even in.',
      }),
    },
  },
};

export const EmailAlreadyExists: Story = {
  args: {
    kcContext: {
      profile: { attributesByName: filledIn },
      messagesPerField: serverErrors({
        email: 'Er is al een account met dit e-mailadres. Log in, of vraag een nieuw wachtwoord aan als je het kwijt bent.',
      }),
    },
  },
};

/** A realm that puts the password on the register form ("Always set password on register form"). */
export const PasswordOnForm: Story = {
  args: { kcContext: { passwordRequired: true } },
};

export const PasswordPolicyViolation: Story = {
  args: {
    kcContext: {
      passwordRequired: true,
      profile: { attributesByName: filledIn },
      messagesPerField: serverErrors({ password: 'Je wachtwoord heeft minimaal 12 tekens nodig.' }),
    },
  },
};

export const GlobalError: Story = {
  args: {
    kcContext: {
      message: { type: 'error', summary: 'Er ging iets mis aan onze kant. Probeer het zo weer.' },
      messagesPerField: serverErrors({ global: 'Er ging iets mis aan onze kant. Probeer het zo weer.' }),
    },
  },
};

export const TermsRequired: Story = {
  args: {
    kcContext: {
      termsAcceptanceRequired: true,
      profile: { attributesByName: filledIn },
    },
  },
};

export const English: Story = {
  args: { kcContext: { locale: { currentLanguageTag: 'en' } } },
};

export const EnglishEmailAlreadyExists: Story = {
  args: {
    kcContext: {
      locale: { currentLanguageTag: 'en' },
      profile: { attributesByName: filledIn },
      messagesPerField: serverErrors({
        email: "There's already an account with this email. Log in instead, or reset your password if you've lost it.",
      }),
    },
  },
};
