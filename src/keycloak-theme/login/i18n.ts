import { i18nBuilder } from 'keycloakify/login';
import type { ThemeName } from '../kc.gen';

/**
 * Taldo copy for the Keycloak pages. Dutch is the default (informal "je", see the design
 * system's voice & tone); English is the second language.
 *
 * Keycloakify reads these translations statically at build time and ships them in the theme
 * JAR, so messages Keycloak renders server-side (e.g. "email already exists") use them too.
 * That is why everything is declared inline here — it can't be imported from other files.
 *
 * Besides the new register-flow keys, this overrides the Keycloak messages the registration
 * form can show: Keycloak's Dutch defaults use the formal "uw", and some have no Dutch text.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- only its type is used
const { useI18n, ofTypeI18n } = i18nBuilder
  .withThemeName<ThemeName>()
  .withCustomTranslations({
    nl: {
      registerTitle: 'Account aanmaken',
      doRegister: 'Account aanmaken',
      registerStepOf: 'Stap {0} van {1}',
      registerPreviousStep: 'Vorige stap',
      registerNext: 'Volgende',
      registerHaveAccount: 'Heb je al een account?',
      registerQuestionFirstName: 'Hoe heet je?',
      registerQuestionLastName: 'En je achternaam?',
      registerQuestionEmail: 'Wat is je werkmailadres?',
      registerQuestionPassword: 'Kies een wachtwoord',
      registerPlaceholderFirstName: 'Sanne',
      registerPlaceholderLastName: 'de Vries',
      registerPlaceholderEmail: 'sanne@bedrijf.nl',
      registerPasswordHint: 'Minimaal {0} tekens.',
      showPassword: 'Wachtwoord tonen',
      hidePassword: 'Wachtwoord verbergen',
      languages: 'Taal',

      'error-user-attribute-required': 'Vul dit veld nog even in.',
      'error-invalid-length': 'Gebruik tussen de {1} en {2} tekens.',
      'error-invalid-length-too-long': 'Gebruik maximaal {2} tekens.',
      'error-invalid-email': 'Dit lijkt geen geldig e-mailadres. Check je het nog even?',
      missingFirstNameMessage: 'Vul je voornaam nog even in.',
      missingLastNameMessage: 'Vul je achternaam nog even in.',
      missingEmailMessage: 'Vul je werkmailadres nog even in.',
      missingPasswordMessage: 'Kies nog een wachtwoord.',
      invalidEmailMessage: 'Dit lijkt geen geldig e-mailadres. Check je het nog even?',
      emailExistsMessage:
        'Er is al een account met dit e-mailadres. Log in, of vraag een nieuw wachtwoord aan als je het kwijt bent.',
      notMatchPasswordMessage: 'De wachtwoorden zijn niet hetzelfde.',
      invalidPasswordConfirmMessage: 'De wachtwoorden zijn niet hetzelfde.',
      invalidPasswordMinLengthMessage: 'Je wachtwoord heeft minimaal {0} tekens nodig.',
      invalidPasswordMaxLengthMessage: 'Je wachtwoord mag maximaal {0} tekens hebben.',
      invalidPasswordNotEmailMessage: 'Je wachtwoord mag niet hetzelfde zijn als je e-mailadres.',
      // Custom error keys set by the realm's User Profile validators (taldo-api realm).
      publicEmailDomainNotAllowed:
        'Gebruik je werkmailadres. Adressen van publieke mailproviders kunnen we niet gebruiken.',
      invalidPersonName: 'Gebruik alleen letters, spaties, koppeltekens, apostroffen en punten.',
    },
    en: {
      registerTitle: 'Create your account',
      doRegister: 'Create account',
      registerStepOf: 'Step {0} of {1}',
      registerPreviousStep: 'Previous step',
      registerNext: 'Next',
      registerHaveAccount: 'Already have an account?',
      registerQuestionFirstName: "What's your first name?",
      registerQuestionLastName: 'And your last name?',
      registerQuestionEmail: "What's your work email?",
      registerQuestionPassword: 'Choose a password',
      registerPlaceholderFirstName: 'Sanne',
      registerPlaceholderLastName: 'de Vries',
      registerPlaceholderEmail: 'sanne@company.com',
      registerPasswordHint: 'At least {0} characters.',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      languages: 'Language',

      'error-user-attribute-required': 'Please fill in this field.',
      'error-invalid-length': 'Use between {1} and {2} characters.',
      'error-invalid-length-too-long': 'Use at most {2} characters.',
      'error-invalid-email': "That doesn't look like a valid email address. Could you check it?",
      missingFirstNameMessage: 'Please fill in your first name.',
      missingLastNameMessage: 'Please fill in your last name.',
      missingEmailMessage: 'Please fill in your work email.',
      missingPasswordMessage: 'Please choose a password.',
      invalidEmailMessage: "That doesn't look like a valid email address. Could you check it?",
      emailExistsMessage:
        "There's already an account with this email. Log in instead, or reset your password if you've lost it.",
      notMatchPasswordMessage: "The passwords don't match.",
      invalidPasswordConfirmMessage: "The passwords don't match.",
      invalidPasswordMinLengthMessage: 'Your password needs at least {0} characters.',
      invalidPasswordMaxLengthMessage: 'Your password can have at most {0} characters.',
      invalidPasswordNotEmailMessage: "Your password can't be the same as your email address.",
      publicEmailDomainNotAllowed:
        'Please use your work e-mail address. Addresses from public mail providers cannot be used.',
      invalidPersonName: 'Use letters, spaces, hyphens, apostrophes and periods only.',
    },
  })
  .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };
