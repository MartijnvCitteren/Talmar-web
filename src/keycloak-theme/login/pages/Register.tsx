import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { PageProps } from 'keycloakify/login/pages/PageProps';
import {
  useUserProfileForm,
  type FormFieldError,
  type FormFieldState,
} from 'keycloakify/login/lib/useUserProfileForm';
import { Button, Checkbox, PasswordField, TextField } from '../../../shared/ui';
import type { KcContext } from '../KcContext';
import type { I18n } from '../i18n';
import Template from '../Template';
import { SignupPanel } from '../SignupPanel';
import { extractJavaPatterns } from './register/javaPatterns';
import page from './page.module.css';
import styles from './Register.module.css';

type RegisterProps = PageProps<Extract<KcContext, { pageId: 'register.ftl' }>, I18n>;

type PlaceholderKey = 'registerPlaceholderFirstName' | 'registerPlaceholderLastName' | 'registerPlaceholderEmail';

const PLACEHOLDERS: Record<string, PlaceholderKey> = {
  firstName: 'registerPlaceholderFirstName',
  lastName: 'registerPlaceholderLastName',
  email: 'registerPlaceholderEmail',
};

const AUTOCOMPLETE: Record<string, string> = {
  email: 'email',
  firstName: 'given-name',
  lastName: 'family-name',
  password: 'new-password',
  'password-confirm': 'new-password',
};

/** Shown in this order; any other User Profile attribute follows, the password fields last. */
const LEADING_FIELDS = ['firstName', 'lastName', 'email'];
const PASSWORD_FIELDS = ['password', 'password-confirm'];

/**
 * register.ftl — the first sign-up step: name and work e-mail, on one screen.
 *
 * With e-mail verification on (the taldo realm), Keycloak leaves the password off this form and
 * asks for it after the address is verified (login-update-password.ftl). If a realm does put it
 * on the form, it is rendered here too. Fields and validation come from Keycloak's User Profile
 * via Keycloakify's useUserProfileForm; Keycloak stays the authority on submit.
 */
export default function Register({ kcContext, i18n, doUseDefaultCss, classes }: RegisterProps) {
  const {
    url,
    realm,
    messagesPerField,
    passwordPolicies,
    recaptchaRequired,
    recaptchaVisible,
    recaptchaSiteKey,
    recaptchaAction,
    termsAcceptanceRequired,
  } = kcContext;
  const { msg, msgStr, advancedMsgStr } = i18n;

  // Java-only User Profile patterns are checked here instead of by Keycloakify (see javaPatterns.ts).
  const { kcContextForForm, javaPatterns } = useMemo(() => {
    const { attributesByName, javaPatterns } = extractJavaPatterns(kcContext.profile.attributesByName);
    return { kcContextForForm: { ...kcContext, profile: { ...kcContext.profile, attributesByName } }, javaPatterns };
  }, [kcContext]);

  const {
    formState: { formFieldStates, isFormSubmittable },
    dispatchFormAction,
  } = useUserProfileForm({ kcContext: kcContextForForm, i18n, doMakeUserConfirmPassword: true });

  // Fields whose Java pattern result is shown: after focus loss, like Keycloakify's own errors.
  const [patternCheckedFields, setPatternCheckedFields] = useState<ReadonlySet<string>>(new Set());
  const patternError = (name: string, value: string): string | undefined => {
    const javaPattern = javaPatterns[name];
    if (!javaPattern || value === '' || javaPattern.regExp.test(value)) {
      return undefined;
    }
    return advancedMsgStr(javaPattern.errorMessageKey ?? 'shouldMatchPattern');
  };
  const errorsOf = ({ attribute, displayableErrors, valueOrValues }: FormFieldState): string[] => {
    // "Required" first: for an empty field it is the one thing to fix.
    const errors = [...displayableErrors]
      .sort((a, b) => Number(isRequiredError(b)) - Number(isRequiredError(a)))
      .map((error) => error.errorMessageStr);
    const fromPattern = patternCheckedFields.has(attribute.name)
      ? patternError(attribute.name, String(valueOrValues))
      : undefined;
    return [...new Set(fromPattern ? [...errors, fromPattern] : errors)];
  };
  const hasPatternFailure = formFieldStates.some(
    ({ attribute, valueOrValues }) => patternError(attribute.name, String(valueOrValues)) !== undefined,
  );

  const visibleFields = orderFields(
    formFieldStates.filter(({ attribute }) => attribute.annotations.inputType !== 'hidden'),
  );
  const hiddenFields = formFieldStates.filter(({ attribute }) => attribute.annotations.inputType === 'hidden');
  const hasTermsError = messagesPerField.existsError('termsAccepted');

  const [areTermsAccepted, setAreTermsAccepted] = useState(false);
  const [isCheckPending, setIsCheckPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const loseFocus = (name: string) => {
    dispatchFormAction({ action: 'focus lost', name, fieldIndex: undefined });
    setPatternCheckedFields((checked) => new Set(checked).add(name));
  };

  // Invisible reCAPTCHA submits through this callback (same contract as Keycloak's register.ftl).
  useLayoutEffect(() => {
    const recaptchaWindow = window as unknown as Record<string, unknown>;
    recaptchaWindow.onSubmitRecaptcha = () => formRef.current?.requestSubmit();
    return () => {
      delete recaptchaWindow.onSubmitRecaptcha;
    };
  }, []);

  // A page Keycloak sent back with errors opens on the first field to fix.
  useEffect(() => {
    const firstInvalid = visibleFields.find((state) => errorsOf(state).length > 0);
    if (firstInvalid) {
      document.getElementById(firstInvalid.attribute.name)?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on the initial render
  }, []);

  // After a blocked submit, once the revealed errors are in the form state: focus the first one.
  useEffect(() => {
    if (!isCheckPending) {
      return;
    }
    setIsCheckPending(false);
    const firstInvalid = visibleFields.find((state) => errorsOf(state).length > 0);
    if (firstInvalid) {
      document.getElementById(firstInvalid.attribute.name)?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to the form state after a check
  }, [isCheckPending, formFieldStates, patternCheckedFields]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!isFormSubmittable || hasPatternFailure || (termsAcceptanceRequired && !areTermsAccepted)) {
      event.preventDefault();
      formFieldStates.forEach(({ attribute }) => loseFocus(attribute.name));
      setIsCheckPending(true);
    }
    // Otherwise the browser posts the form to Keycloak.
  };

  const useInvisibleRecaptcha = recaptchaRequired && !recaptchaVisible && recaptchaAction !== undefined;
  const useVisibleRecaptcha = recaptchaRequired && (recaptchaVisible || recaptchaAction === undefined);
  const hasPasswordOnForm = visibleFields.some(({ attribute }) => attribute.name === 'password');

  const renderField = (state: FormFieldState) => (
    <Field
      key={state.attribute.name}
      state={state}
      errors={errorsOf(state)}
      i18n={i18n}
      passwordMinLength={passwordPolicies?.length}
      onChange={(value) => dispatchFormAction({ action: 'update', name: state.attribute.name, valueOrValues: value })}
      onBlur={() => loseFocus(state.attribute.name)}
    />
  );
  const valueOf = (name: string) => String(formFieldStates.find(({ attribute }) => attribute.name === name)?.valueOrValues ?? '');
  const email = valueOf('email').trim();
  const nameFields = visibleFields.filter(({ attribute }) => ['firstName', 'lastName'].includes(attribute.name));
  const otherFields = visibleFields.filter(({ attribute }) => !['firstName', 'lastName'].includes(attribute.name));

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      documentTitle={`${msgStr('registerTitle')} · ${realm.displayName || 'Taldo'}`}
      headerNode={msg('registerTitle')}
      displayMessage={messagesPerField.exists('global')}
      signupStep="details"
      aside={
        <SignupPanel
          step="details"
          i18n={i18n}
          name={`${valueOf('firstName').trim()} ${valueOf('lastName').trim()}`.trim()}
          email={email}
          isWorkEmail={patternError('email', email) === undefined}
        />
      }
      footer={
        <p>
          {msgStr('registerHaveAccount')}{' '}
          <a href={url.loginUrl} className={page.link}>
            {msgStr('doLogIn')}
          </a>
        </p>
      }
    >
      <div className={page.intro}>
        <h1>{msgStr('registerTitle')}</h1>
        <p className={page.lede}>
          {msgStr(hasPasswordOnForm ? 'registerLedeWithPassword' : 'registerLede')}
        </p>
      </div>

      <form
        ref={formRef}
        id="kc-register-form"
        className={page.form}
        action={url.registrationAction}
        method="post"
        noValidate
        onSubmit={onSubmit}
      >
        {hiddenFields.map(({ attribute, valueOrValues }) => (
          <input key={attribute.name} type="hidden" name={attribute.name} value={String(valueOrValues)} />
        ))}

        {nameFields.length > 0 && <div className={styles.names}>{nameFields.map(renderField)}</div>}
        {otherFields.map(renderField)}

        {termsAcceptanceRequired && (
          <div className={styles.terms}>
            <div className={styles.termsText}>{msg('termsText')}</div>
            <Checkbox
              name="termsAccepted"
              label={msgStr('acceptTerms')}
              checked={areTermsAccepted}
              onChange={setAreTermsAccepted}
              error={hasTermsError ? advancedMsgStr(messagesPerField.get('termsAccepted')) : undefined}
            />
          </div>
        )}
        {useVisibleRecaptcha && (
          <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey} data-action={recaptchaAction} />
        )}

        <Button
          type="submit"
          className={[page.submit, useInvisibleRecaptcha && 'g-recaptcha'].filter(Boolean).join(' ')}
          {...(useInvisibleRecaptcha && {
            'data-sitekey': recaptchaSiteKey,
            'data-callback': 'onSubmitRecaptcha',
            'data-action': recaptchaAction,
          })}
        >
          {msgStr('doRegister')}
        </Button>
      </form>
    </Template>
  );
}

function orderFields(states: FormFieldState[]): FormFieldState[] {
  const rank = (name: string) => {
    const leading = LEADING_FIELDS.indexOf(name);
    if (leading !== -1) return leading;
    const password = PASSWORD_FIELDS.indexOf(name);
    if (password !== -1) return LEADING_FIELDS.length + 1 + password;
    return LEADING_FIELDS.length;
  };
  // Array.prototype.sort is stable, so other attributes keep their User Profile order.
  return [...states].sort((a, b) => rank(a.attribute.name) - rank(b.attribute.name));
}

function isRequiredError(error: FormFieldError): boolean {
  return error.source.type === 'other' && error.source.rule === 'requiredField';
}

interface FieldProps {
  state: FormFieldState;
  errors: string[];
  i18n: I18n;
  passwordMinLength: number | undefined;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function Field({ state, errors, i18n, passwordMinLength, onChange, onBlur }: FieldProps) {
  const { attribute, valueOrValues } = state;
  const { msgStr, advancedMsgStr } = i18n;
  const placeholderKey = PLACEHOLDERS[attribute.name];
  const placeholder = placeholderKey
    ? msgStr(placeholderKey)
    : attribute.annotations.inputTypePlaceholder !== undefined
      ? advancedMsgStr(attribute.annotations.inputTypePlaceholder)
      : undefined;

  const commonProps = {
    id: attribute.name,
    name: attribute.name,
    label: attribute.name === 'email' ? msgStr('registerEmailLabel') : advancedMsgStr(attribute.displayName ?? attribute.name),
    value: String(valueOrValues),
    onChange,
    onBlur,
    required: attribute.required,
    autoComplete: (AUTOCOMPLETE[attribute.name] ?? attribute.autocomplete) as never,
    placeholder,
    // One message at a time: the first problem to fix (e.g. "required" before "doesn't match").
    error: errors[0],
  };

  if (attribute.name === 'password' || attribute.name === 'password-confirm') {
    return (
      <PasswordField
        {...commonProps}
        helperText={
          attribute.name === 'password' && passwordMinLength !== undefined
            ? msgStr('registerPasswordHint', String(passwordMinLength))
            : undefined
        }
        toggleLabels={{ show: msgStr('showPassword'), hide: msgStr('hidePassword') }}
      />
    );
  }

  return (
    <TextField
      {...commonProps}
      type={attribute.name === 'email' ? 'email' : 'text'}
      helperText={attribute.name === 'email' ? msgStr('registerEmailHint') : undefined}
    />
  );
}
