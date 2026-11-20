import { useState, type FormEvent } from 'react';
import { Building2, Ellipsis, IdCard, UserSearch, Users, type LucideIcon } from 'lucide-react';
import { jobRoleOptions, type JobRole } from '../../../entities/account';
import { Button, ErrorBanner } from '../../../shared/ui';
import { useOnboardAccount, type OnboardingOutcome } from '../lib/useOnboardAccount';
import styles from './JobRoleForm.module.css';

const ICONS: Record<JobRole, LucideIcon> = {
  RECRUITER: UserSearch,
  HR: IdCard,
  HIRING_MANAGER: Users,
  FOUNDER_OR_DIRECTOR: Building2,
  OTHER: Ellipsis,
};

export interface JobRoleFormProps {
  /** Called once onboarding succeeded (or had already happened). */
  onDone: (outcome: OnboardingOutcome) => void;
}

/** The last sign-up step: pick a job role, which finishes the account (`POST /onboarding`). */
export function JobRoleForm({ onDone }: JobRoleFormProps) {
  const [jobRole, setJobRole] = useState<JobRole | undefined>(undefined);
  const [showMissing, setShowMissing] = useState(false);
  const { onboard, submitting, error } = useOnboardAccount();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jobRole) {
      setShowMissing(true);
      document.getElementById(`job-role-${jobRoleOptions[0].value}`)?.focus();
      return;
    }
    const outcome = await onboard(jobRole);
    if (outcome) {
      onDone(outcome);
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <ErrorBanner message={error} />
      <fieldset
        className={styles.fieldset}
        aria-invalid={showMissing && !jobRole ? true : undefined}
        aria-describedby={showMissing && !jobRole ? 'job-role-missing' : undefined}
      >
        <legend className={styles.legend}>Kies je rol</legend>
        {jobRoleOptions.map(({ value, label, description }) => {
          const Icon = ICONS[value];
          return (
            <label key={value} className={styles.option}>
              <input
                id={`job-role-${value}`}
                type="radio"
                name="jobRole"
                value={value}
                className={styles.radio}
                checked={jobRole === value}
                onChange={() => {
                  setJobRole(value);
                  setShowMissing(false);
                }}
              />
              <span className={styles.icon} aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className={styles.text}>
                <span className={styles.label}>{label}</span>
                <span className={styles.description}>{description}</span>
              </span>
              <span className={styles.indicator} aria-hidden="true" />
            </label>
          );
        })}
      </fieldset>
      {showMissing && !jobRole && (
        <p id="job-role-missing" className={styles.missing}>
          Kies de rol die het best bij je past.
        </p>
      )}
      <Button type="submit" className={styles.submit} disabled={submitting}>
        {submitting ? 'Bezig met afronden…' : 'Account afronden'}
      </Button>
    </form>
  );
}
