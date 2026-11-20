import type { ReactNode } from 'react';
import { Logo } from './Logo';
import styles from './FlowLayout.module.css';

export interface FlowLayoutProps {
  /** Right of the logo in the top bar, e.g. the language links. */
  headerEnd?: ReactNode;
  /** A ProgressRail: beside the content on wide screens, above it on narrow ones. */
  progress?: ReactNode;
  /** Below the content, e.g. "Already have an account? Log in". */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * The frame for a focused flow outside the app's navigation: sign-up, login, onboarding.
 * A quiet top bar with the logo, one narrow left-aligned column for the task, and optionally
 * the steps of the flow next to it. Shared by the Keycloak theme and the app, so the sign-up
 * path looks like one product while it moves between the two.
 */
export function FlowLayout({ headerEnd, progress, footer, children }: FlowLayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo variant="lockup" size={28} />
        {headerEnd}
      </header>
      <div className={styles.body} data-has-progress={progress !== undefined}>
        {progress && <div className={styles.progress}>{progress}</div>}
        <main className={styles.main}>
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </main>
      </div>
    </div>
  );
}
