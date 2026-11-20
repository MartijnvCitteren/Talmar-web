import styles from './ProgressRail.module.css';

export interface ProgressRailProps {
  /** The step names, in order; read out to screen readers. */
  steps: string[];
  /** Index of the step the user is on; everything before it is done. */
  currentIndex: number;
  /** Accessible name of the list, e.g. "Je aanmelding". */
  label: string;
  /** The one line above the bar, e.g. "Stap 2 van 4: Mail bevestigen". */
  summary: string;
}

/**
 * Where the user is in a fixed sequence of steps that may span several pages (or even apps,
 * like sign-up: Keycloak pages, then the app): one line of text over a segmented bar.
 * Read-only: it never navigates.
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
              key={step}
              className={styles.step}
              data-status={status}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              <span className={styles.text}>{step}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
