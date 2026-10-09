import { useId, useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { isAccountRole, roleOptions } from '../../../entities/account';
import type { AccountRole, SignUpResponse } from '../../../entities/account';
import {
  Button,
  DotProgress,
  ErrorBanner,
  Logo,
  OnboardingLayout,
  Select,
  TextField,
} from '../../../shared/ui';
import { useSignUp } from '../lib/useSignUp';
import { validateWorkEmail, workEmailErrors } from '../lib/workEmail';
import illusHi from '../assets/illus-hi.jpeg';
import illusMeet from '../assets/illus-meet.jpeg';
import illusEmail from '../assets/illus-email.jpeg';
import illusRole from '../assets/illus-role.jpeg';
import styles from './SignupWizard.module.css';

interface Draft {
  firstName: string;
  lastName: string;
  email: string;
  role: AccountRole | '';
}

type StepId = keyof Draft;

const STEPS: { id: StepId; title: string; illustration: string; alt: string }[] = [
  { id: 'firstName', title: 'Hoe heet je?', illustration: illusHi, alt: 'Illustratie: iemand zwaait hallo' },
  {
    id: 'lastName',
    title: 'En je achternaam?',
    illustration: illusMeet,
    alt: 'Illustratie: twee mensen geven elkaar een hand',
  },
  {
    id: 'email',
    title: 'Wat is je werk e-mail?',
    illustration: illusEmail,
    alt: 'Illustratie: iemand wijst naar een envelop',
  },
  {
    id: 'role',
    title: 'Wat is je rol?',
    illustration: illusRole,
    alt: 'Illustratie: iemand met laptop, map en grafiek',
  },
];

const EMPTY_DRAFT: Draft = { firstName: '', lastName: '', email: '', role: '' };

export interface SignupWizardProps {
  /** Called once the account exists and the verification mail is on its way. */
  onCompleted: (response: SignUpResponse) => void;
}

/** HR self-signup: one question per screen, values kept when stepping back. */
export function SignupWizard({ onCompleted }: SignupWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [emailError, setEmailError] = useState<string | undefined>();
  const { submit, submitting, error: submitError } = useSignUp();
  const titleId = useId();

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const canContinue = draft[step.id].trim() !== '';

  function update(field: StepId, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === 'email') setEmailError(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canContinue || submitting) return;

    if (step.id === 'email') {
      const problem = validateWorkEmail(draft.email);
      if (problem) {
        setEmailError(workEmailErrors[problem]);
        return;
      }
    }

    if (!isLastStep) {
      setStepIndex((index) => index + 1);
      return;
    }

    if (!isAccountRole(draft.role)) return;
    const response = await submit({
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      role: draft.role,
    });
    if (response) onCompleted(response);
  }

  const leading =
    stepIndex === 0 ? (
      <Logo variant="lockup" />
    ) : (
      <Button
        type="button"
        variant="text"
        className={styles.back}
        aria-label="Terug"
        onClick={() => setStepIndex((index) => index - 1)}
      >
        <ArrowLeft size={16} aria-hidden="true" />
      </Button>
    );

  return (
    <OnboardingLayout leading={leading} caption={`Stap ${stepIndex + 1} van ${STEPS.length}`}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-labelledby={titleId}>
        <DotProgress current={stepIndex + 1} total={STEPS.length} />
        <h1 id={titleId} className={styles.title}>
          {step.title}
        </h1>

        {step.id === 'firstName' && (
          <TextField
            key="firstName"
            label="Voornaam"
            placeholder="Sanne"
            autoComplete="given-name"
            autoFocus
            value={draft.firstName}
            onChange={(value) => update('firstName', value)}
          />
        )}
        {step.id === 'lastName' && (
          <TextField
            key="lastName"
            label="Achternaam"
            placeholder="de Vries"
            autoComplete="family-name"
            autoFocus
            value={draft.lastName}
            onChange={(value) => update('lastName', value)}
          />
        )}
        {step.id === 'email' && (
          <TextField
            key="email"
            label="Werk e-mail"
            type="email"
            placeholder="sanne@bedrijf.nl"
            autoComplete="work email"
            helperText="we sturen hier een verificatielink naartoe"
            autoFocus
            value={draft.email}
            error={emailError}
            onChange={(value) => update('email', value)}
          />
        )}
        {step.id === 'role' && (
          <Select
            key="role"
            label="Rol"
            placeholder="Kies je rol"
            options={roleOptions}
            autoFocus
            value={draft.role}
            onChange={(value) => update('role', value)}
          />
        )}

        <img className={styles.illustration} src={step.illustration} alt={step.alt} />

        {isLastStep && <ErrorBanner message={submitError} />}

        <Button
          type="submit"
          className={styles.submit}
          disabled={!canContinue || submitting}
          aria-busy={submitting || undefined}
        >
          {isLastStep ? 'Account maken' : 'Volgende'}
        </Button>
      </form>
    </OnboardingLayout>
  );
}
