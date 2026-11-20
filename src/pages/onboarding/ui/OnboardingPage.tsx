import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobRoleOptions, type JobRole } from '../../../entities/account';
import { JobRoleForm, PendingApproval, type OnboardingOutcome } from '../../../features/onboard-account';
import { FlowLayout, IdBadge, ProgressRail } from '../../../shared/ui';
import styles from './OnboardingPage.module.css';

/**
 * The same four sign-up steps the Keycloak pages show (src/keycloak-theme/login/signupSteps.ts),
 * so moving from Keycloak to the app reads as one path. Dutch only, like the rest of the app.
 */
const SIGNUP_STEPS = ['Je gegevens', 'Mailadres bevestigen', 'Wachtwoord kiezen', 'Je rol'];
const ROLE_STEP = 3;

/** Where an active account starts: the app's first screen. */
const APP_HOME = '/vacancies/new';

/**
 * The last sign-up step, right after the first login: the job role, sent with
 * `POST /onboarding` (taldo-api IdentityApi.yml). An account that joins a company already on
 * Taldo waits for its owner's approval; that is shown here instead of going into the app.
 *
 * On wide screens the ID badge from the Keycloak pages hangs beside it, now getting its role.
 * The app has no profile data yet (no login), so the badge shows the role and status only.
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [jobRole, setJobRole] = useState<JobRole | undefined>(undefined);

  const onDone = (outcome: OnboardingOutcome) => {
    if (outcome === 'PENDING_APPROVAL') {
      setIsPending(true);
    } else {
      navigate(APP_HOME, { replace: true });
    }
  };

  const roleLabel = jobRoleOptions.find(({ value }) => value === jobRole)?.label;

  return (
    <FlowLayout
      progress={
        <ProgressRail
          steps={SIGNUP_STEPS}
          currentIndex={isPending ? SIGNUP_STEPS.length : ROLE_STEP}
          label="Je aanmelding"
          summary={
            isPending ? 'Alle stappen gedaan' : `Stap ${ROLE_STEP + 1} van ${SIGNUP_STEPS.length}: ${SIGNUP_STEPS[ROLE_STEP]}`
          }
        />
      }
      aside={
        <>
          <IdBadge
            label="Voorbeeld van je account"
            heading="Je Taldo-account"
            namePlaceholder="Je naam"
            fields={[{ label: 'Rol', placeholder: 'Kies je rol', value: roleLabel }]}
            status={
              isPending
                ? { tone: 'attention', label: 'Wacht op goedkeuring' }
                : { tone: 'passed', label: 'Mailadres bevestigd' }
            }
          />
          <p className={styles.caption}>
            {isPending
              ? 'Je bedrijf werkt al met Taldo. Zodra de beheerder je toelaat, ben je binnen.'
              : 'Nog één keuze, dan ben je binnen.'}
          </p>
        </>
      }
    >
      {isPending ? (
        <PendingApproval />
      ) : (
        <>
          <div className={styles.intro}>
            <h1>Wat is je rol?</h1>
            <p className={styles.lede}>
              Kies wat het best past bij wat je doet. Het komt in je profiel en verandert niets aan wat je in Taldo
              mag.
            </p>
          </div>
          <JobRoleForm onDone={onDone} onRoleChange={setJobRole} />
        </>
      )}
    </FlowLayout>
  );
}
