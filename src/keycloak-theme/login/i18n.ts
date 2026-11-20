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
 * Besides the new sign-up keys, this overrides the Keycloak messages the sign-up pages
 * (register, verify e-mail, update password, info) can show: Keycloak's Dutch defaults use the formal "uw", and some have no Dutch text.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- only its type is used
const { useI18n, ofTypeI18n } = i18nBuilder
  .withThemeName<ThemeName>()
  .withCustomTranslations({
    nl: {
      registerTitle: 'Maak je account aan',
      doRegister: 'Account aanmaken',
      registerLede: 'Alleen je naam en je werkmailadres. Je wachtwoord kies je straks, als je je mailadres hebt bevestigd.',
      registerLedeWithPassword: 'Je naam, je werkmailadres en een wachtwoord. Daarna bevestig je je mailadres.',
      registerHaveAccount: 'Heb je al een account?',
      registerEmailLabel: 'Werkmailadres',
      registerEmailHint: 'Hiermee koppelen we je aan je bedrijf.',
      registerPlaceholderFirstName: 'Sanne',
      registerPlaceholderLastName: 'de Vries',
      registerPlaceholderEmail: 'sanne@bedrijf.nl',
      registerPasswordHint: 'Minimaal {0} tekens.',
      showPassword: 'Wachtwoord tonen',
      hidePassword: 'Wachtwoord verbergen',
      languages: 'Taal',

      signupProgressLabel: 'Je aanmelding',
      signupProgressSummary: 'Stap {0} van {1}: {2}',
      signupStepDetails: 'Je gegevens',
      signupStepDetailsHint: 'Naam en werkmailadres',
      signupStepVerify: 'Mailadres bevestigen',
      signupStepVerifyHint: 'Via de link die we je mailen',
      signupStepPassword: 'Wachtwoord kiezen',
      signupStepPasswordHint: 'Om mee in te loggen',
      signupStepRole: 'Je rol',
      signupStepRoleHint: 'Wat je doet bij het werven',

      emailVerifyTitle: 'Check je inbox',
      verifyEmailSentTo: 'We hebben een mail met een bevestigingslink gestuurd naar',
      verifyEmailInstruction: 'Klik op de link in die mail. Daarna kies je een wachtwoord.',
      verifyEmailNoMail: 'Geen mail gekregen? Kijk ook even in je spam. Staat hij daar niet, dan sturen we hem opnieuw.',
      verifyEmailResend: 'Stuur de mail opnieuw',
      emailSentMessage: 'We hebben de mail opnieuw gestuurd. Hij kan een paar minuten onderweg zijn.',
      emailVerifiedMessage: 'Je mailadres is bevestigd.',
      emailVerifiedAlreadyMessage: 'Je mailadres was al bevestigd.',
      confirmEmailAddressVerification: 'Klopt het dat {0} jouw mailadres is? Ga dan verder om het te bevestigen.',

      updatePasswordTitle: 'Kies een wachtwoord',
      updatePasswordLede: 'Met dit wachtwoord log je voortaan in bij Taldo.',
      updatePasswordHint: 'Lang werkt beter dan ingewikkeld, bijvoorbeeld een zin van een paar woorden.',
      updatePasswordSubmit: 'Wachtwoord opslaan',
      passwordNew: 'Wachtwoord',
      passwordConfirm: 'Herhaal je wachtwoord',
      logoutOtherSessions: 'Log uit op je andere apparaten',
      doSubmit: 'Opslaan',
      doCancel: 'Annuleren',

      infoTitle: 'Nog één ding',
      proceedWithAction: 'Ga verder',
      backToApplication: 'Terug naar Taldo',
      'requiredAction.UPDATE_PASSWORD': 'Wachtwoord kiezen',
      'requiredAction.VERIFY_EMAIL': 'Mailadres bevestigen',
      'requiredAction.UPDATE_PROFILE': 'Profiel aanvullen',
      expiredActionMessage: 'Deze link is verlopen. Log in, dan sturen we je een nieuwe.',
      expiredActionTokenNoSessionMessage: 'Deze link is verlopen. Log in, dan sturen we je een nieuwe.',
      expiredActionTokenSessionExistsMessage: 'Deze link is verlopen. Vraag een nieuwe aan.',

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
      registerLede: 'Just your name and your work email. You choose a password once you have confirmed your email.',
      registerLedeWithPassword: 'Your name, your work email and a password. Then you confirm your email.',
      registerHaveAccount: 'Already have an account?',
      registerEmailLabel: 'Work email',
      registerEmailHint: 'This is how we link you to your company.',
      registerPlaceholderFirstName: 'Sanne',
      registerPlaceholderLastName: 'de Vries',
      registerPlaceholderEmail: 'sanne@company.com',
      registerPasswordHint: 'At least {0} characters.',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      languages: 'Language',

      signupProgressLabel: 'Your sign-up',
      signupProgressSummary: 'Step {0} of {1}: {2}',
      signupStepDetails: 'Your details',
      signupStepDetailsHint: 'Name and work email',
      signupStepVerify: 'Confirm your email',
      signupStepVerifyHint: 'With the link we email you',
      signupStepPassword: 'Choose a password',
      signupStepPasswordHint: 'To log in with',
      signupStepRole: 'Your role',
      signupStepRoleHint: 'What you do in hiring',

      emailVerifyTitle: 'Check your inbox',
      verifyEmailSentTo: 'We sent an email with a confirmation link to',
      verifyEmailInstruction: 'Click the link in that email. Then you choose a password.',
      verifyEmailNoMail: "No email? Check your spam folder too. If it isn't there, we'll send it again.",
      verifyEmailResend: 'Send the email again',
      emailSentMessage: 'We sent the email again. It can take a few minutes to arrive.',
      emailVerifiedMessage: 'Your email address is confirmed.',
      emailVerifiedAlreadyMessage: 'Your email address was already confirmed.',
      confirmEmailAddressVerification: 'Is {0} your email address? Continue to confirm it.',

      updatePasswordTitle: 'Choose a password',
      updatePasswordLede: "This is the password you'll log in to Taldo with.",
      updatePasswordHint: 'Long beats complicated, for example a sentence of a few words.',
      updatePasswordSubmit: 'Save password',
      passwordNew: 'Password',
      passwordConfirm: 'Repeat your password',
      logoutOtherSessions: 'Log out on your other devices',
      doSubmit: 'Save',
      doCancel: 'Cancel',

      infoTitle: 'One more thing',
      proceedWithAction: 'Continue',
      backToApplication: 'Back to Taldo',
      'requiredAction.UPDATE_PASSWORD': 'Choose a password',
      'requiredAction.VERIFY_EMAIL': 'Confirm your email',
      'requiredAction.UPDATE_PROFILE': 'Complete your profile',
      expiredActionMessage: "This link has expired. Log in and we'll send you a new one.",
      expiredActionTokenNoSessionMessage: "This link has expired. Log in and we'll send you a new one.",
      expiredActionTokenSessionExistsMessage: 'This link has expired. Request a new one.',

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
