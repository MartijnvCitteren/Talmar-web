import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
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
import { extractJavaPatterns } from './register/javaPatterns';
import { buildRegisterSteps, firstStepWithError, type RegisterStep } from './register/steps';
import styles from './Register.module.css';

type RegisterProps = PageProps<Extract<KcContext, { pageId: 'register.ftl' }>, I18n>;

type QuestionKey =
  | 'registerQuestionFirstName'
  | 'registerQuestionLastName'
  | 'registerQuestionEmail'
  | 'registerQuestionPassword';
type PlaceholderKey = 'registerPlaceholderFirstName' | 'registerPlaceholderLastName' | 'registerPlaceholderEmail';

const QUESTIONS: Record<string, QuestionKey> = {
  firstName: 'registerQuestionFirstName',
  lastName: 'registerQuestionLastName',
  email: 'registerQuestionEmail',
  password: 'registerQuestionPassword',
};

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

/** After revealing a step's errors, what to do once the form state has caught up. */
type PendingCheck = 'advance' | 'submit' | null;

/**
 * register.ftl — Keycloak's sign-up form, one question per screen.
 *
 * Every field stays in the single form posted to url.registrationAction; a step only decides
 * what is visible. Fields, validation and password-policy feedback come from Keycloak's User
 * Profile via Keycloakify's useUserProfileForm; Keycloak stays the authority on submit.
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

  const stepFields = formFieldStates.map((state) => ({
    name: state.attribute.name,
    inputType: state.attribute.annotations.inputType,
    hasError: errorsOf(state).length > 0,
  }));
  const steps = buildRegisterSteps(stepFields);
  const lastStepIndex = steps.length - 1;
  const hasTermsError = messagesPerField.existsError('termsAccepted');

  const [stepIndex, setStepIndex] = useState(() =>
    hasTermsError ? lastStepIndex : firstStepWithError(steps, stepFields),
  );
  const [areTermsAccepted, setAreTermsAccepted] = useState(false);
  const [pendingCheck, setPendingCheck] = useState<PendingCheck>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isFirstRender = useRef(true);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === lastStepIndex;
  const fieldState = (name: string) => formFieldStates.find(({ attribute }) => attribute.name === name);
  const focusField = (name: string) => document.getElementById(name)?.focus();

  const loseFocus = (name: string) => {
    dispatchFormAction({ action: 'focus lost', name, fieldIndex: undefined });
    setPatternCheckedFields((checked) => new Set(checked).add(name));
  };
  const revealErrors = (fieldNames: string[]) => fieldNames.forEach(loseFocus);

  // Invisible reCAPTCHA submits through this callback (same contract as Keycloak's register.ftl).
  useLayoutEffect(() => {
    const recaptchaWindow = window as unknown as Record<string, unknown>;
    recaptchaWindow.onSubmitRecaptcha = () => formRef.current?.requestSubmit();
    return () => {
      delete recaptchaWindow.onSubmitRecaptcha;
    };
  }, []);

  // A step change moves focus to the step's first field (not on the initial render).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    focusField(steps[stepIndex].fieldNames[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on step change
  }, [stepIndex]);

  // Runs once the errors revealed by "Volgende" / submit are in the form state.
  useEffect(() => {
    if (pendingCheck === null) {
      return;
    }
    setPendingCheck(null);
    const invalidInStep = step.fieldNames.find((name) => stepFields.find((field) => field.name === name)?.hasError);
    if (pendingCheck === 'advance') {
      if (invalidInStep) {
        focusField(invalidInStep);
      } else {
        setStepIndex(stepIndex + 1);
      }
      return;
    }
    const firstInvalidStep = firstStepWithError(steps, stepFields);
    if (stepFields.some((field) => field.hasError) && firstInvalidStep !== stepIndex) {
      setStepIndex(firstInvalidStep);
    } else if (invalidInStep) {
      focusField(invalidInStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to the form state after a check
  }, [pendingCheck, formFieldStates, patternCheckedFields]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!isLastStep) {
      event.preventDefault();
      revealErrors(step.fieldNames);
      setPendingCheck('advance');
      return;
    }
    if (!isFormSubmittable || hasPatternFailure || (termsAcceptanceRequired && !areTermsAccepted)) {
      event.preventDefault();
      revealErrors(steps.flatMap(({ fieldNames }) => fieldNames));
      setPendingCheck('submit');
    }
    // Otherwise the browser posts the form to Keycloak.
  };

  const useInvisibleRecaptcha = recaptchaRequired && !recaptchaVisible && recaptchaAction !== undefined;
  const useVisibleRecaptcha = recaptchaRequired && (recaptchaVisible || recaptchaAction === undefined);
  const hiddenFields = formFieldStates.filter(({ attribute }) => attribute.annotations.inputType === 'hidden');

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      documentTitle={`${msgStr('registerTitle')} · ${realm.displayName || 'Taldo'}`}
      headerNode={msg('registerTitle')}
      displayMessage={messagesPerField.exists('global')}
      headerStart={
        stepIndex > 0 ? (
          <button
            type="button"
            className={styles.back}
            aria-label={msgStr('registerPreviousStep')}
            onClick={() => setStepIndex(stepIndex - 1)}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        ) : undefined
      }
      headerEnd={
        <span className={styles.counter} aria-live="polite">
          {msgStr('registerStepOf', String(stepIndex + 1), String(steps.length))}
        </span>
      }
      footer={
        <p className={styles.login}>
          {msgStr('registerHaveAccount')}{' '}
          <a href={url.loginUrl} className={styles.link}>
            {msgStr('doLogIn')}
          </a>
        </p>
      }
    >
      <ol className={styles.dots} aria-hidden="true">
        {steps.map(({ id }, index) => (
          <li key={id} className={styles.dot} data-active={index <= stepIndex} />
        ))}
      </ol>

      <h1 className={styles.question}>{question(step, fieldState(step.id), i18n)}</h1>

      <form
        ref={formRef}
        id="kc-register-form"
        className={styles.form}
        action={url.registrationAction}
        method="post"
        noValidate
        onSubmit={onSubmit}
      >
        {hiddenFields.map(({ attribute, valueOrValues }) => (
          <input key={attribute.name} type="hidden" name={attribute.name} value={String(valueOrValues)} />
        ))}

        {steps.map((candidate, index) => (
          <div key={candidate.id} className={styles.step} hidden={index !== stepIndex}>
            {candidate.fieldNames.map((name) => {
              const state = fieldState(name);
              return (
                state && (
                  <Field
                    key={name}
                    state={state}
                    errors={errorsOf(state)}
                    i18n={i18n}
                    passwordMinLength={passwordPolicies?.length}
                    onChange={(value) => dispatchFormAction({ action: 'update', name, valueOrValues: value })}
                    onBlur={() => loseFocus(name)}
                  />
                )
              );
            })}
            {index === lastStepIndex && termsAcceptanceRequired && (
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
            {index === lastStepIndex && useVisibleRecaptcha && (
              <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey} data-action={recaptchaAction} />
            )}
            {/* Placeholder until the step illustrations are delivered; keyed by step for the swap. */}
            <div className={styles.illustration} data-illustration={candidate.id} aria-hidden="true" />
          </div>
        ))}

        <Button type="submit" className={styles.submit} hidden={isLastStep}>
          {msgStr('registerNext')}
        </Button>
        {/* Both buttons stay mounted: invisible reCAPTCHA binds to its button when its script loads. */}
        <Button
          type="submit"
          hidden={!isLastStep}
          className={[styles.submit, useInvisibleRecaptcha && 'g-recaptcha'].filter(Boolean).join(' ')}
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

function isRequiredError(error: FormFieldError): boolean {
  return error.source.type === 'other' && error.source.rule === 'requiredField';
}

function question(step: RegisterStep, state: FormFieldState | undefined, i18n: I18n): string {
  const key = QUESTIONS[step.id];
  if (key) {
    return i18n.msgStr(key);
  }
  return i18n.advancedMsgStr(state?.attribute.displayName ?? step.id);
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
    label: advancedMsgStr(attribute.displayName ?? attribute.name),
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

  return <TextField {...commonProps} type={attribute.name === 'email' ? 'email' : 'text'} />;
}
