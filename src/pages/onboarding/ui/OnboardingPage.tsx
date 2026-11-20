import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobRoleForm, PendingApproval, type OnboardingOutcome } from '../../../features/onboard-account';
import { FlowLayout, ProgressRail } from '../../../shared/ui';
import styles from './OnboardingPage.module.css';

/**
 * The same four sign-up steps the Keycloak pages show (src/keycloak-theme/login/signupSteps.ts),
 * so moving from Keycloak to the app reads as one path. Dutch only, like the rest of the app.
 */
const SIGNUP_STEPS = [
  { label: 'Je gegevens', hint: 'Naam en werkmailadres' },
  { label: 'Mailadres bevestigen', hint: 'Via de link die we je mailen' },
  { label: 'Wachtwoord kiezen', hint: 'Om mee in te loggen' },
  { label: 'Je rol', hint: 'Wat je doet bij het werven' },
];
const ROLE_STEP = 3;

/** Where an active account starts: the app's first screen. */
const APP_HOME = '/vacancies/new';

/**
 * The last sign-up step, right after the first login: the job role, sent with
 * `POST /onboarding` (taldo-api IdentityApi.yml). An account that joins a company already on
 * Taldo waits for its owner's approval; that is shown here instead of going into the app.
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const onDone = (outcome: OnboardingOutcome) => {
    if (outcome === 'PENDING_APPROVAL') {
      setIsPending(true);
    } else {
      navigate(APP_HOME, { replace: true });
    }
  };

  const currentIndex = isPending ? SIGNUP_STEPS.length : ROLE_STEP;

  return (
    <FlowLayout
      progress={
        <ProgressRail
          steps={SIGNUP_STEPS}
          currentIndex={currentIndex}
          label="Je aanmelding"
          summary={
            isPending
              ? 'Alle stappen gedaan'
              : `Stap ${ROLE_STEP + 1} van ${SIGNUP_STEPS.length}: ${SIGNUP_STEPS[ROLE_STEP].label}`
          }
        />
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
          <JobRoleForm onDone={onDone} />
        </>
      )}
    </FlowLayout>
  );
}
