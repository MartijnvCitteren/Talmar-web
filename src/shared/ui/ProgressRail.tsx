import { Check } from 'lucide-react';
import styles from './ProgressRail.module.css';

export interface ProgressRailStep {
  label: string;
  /** One line under the label on wide screens: what the step asks of the user. */
  hint?: string;
}

export interface ProgressRailProps {
  steps: ProgressRailStep[];
  /** Index of the step the user is on; everything before it is done. */
  currentIndex: number;
  /** Accessible name of the list, e.g. "Je aanmelding". */
  label: string;
  /** Shown above the bar on narrow screens, e.g. "Stap 2 van 4: Mail bevestigen". */
  summary: string;
}

/**
 * Where the user is in a fixed sequence of steps that may span several pages (or even apps,
 * like sign-up: Keycloak pages, then the app). Read-only: it never navigates.
 *
 * Wide screens get a vertical rail with every step and its hint, so the whole path is visible
 * up front. Narrow screens get a segmented bar with one line of text.
 */
export function ProgressRail({ steps, currentIndex, label, summary }: ProgressRailProps) {
  return (
    <nav className={styles.rail} aria-label={label}>
      <p className={styles.summary} aria-hidden="true">
        {summary}
      </p>
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const status = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
          return (
            <li
              key={step.label}
              className={styles.step}
              data-status={status}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              <span className={styles.marker} aria-hidden="true">
                {status === 'done' ? <Check size={14} strokeWidth={3} /> : index + 1}
              </span>
              <span className={styles.text}>
                <span className={styles.label}>{step.label}</span>
                {step.hint && <span className={styles.hint}>{step.hint}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
