import type { ReactNode } from 'react';
import { Logo } from './Logo';
import styles from './FlowLayout.module.css';

export interface FlowLayoutProps {
  /** Right of the logo in the top bar, e.g. the language links. */
  headerEnd?: ReactNode;
  /** A ProgressRail, above the content. */
  progress?: ReactNode;
  /** Below the content, e.g. "Already have an account? Log in". */
  footer?: ReactNode;
  /**
   * From 1024px: a full-height teal panel to the right of the task, e.g. a preview of what
   * the flow creates. Hidden on smaller screens, where the task alone fills the screen.
   */
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * The frame for a focused flow outside the app's navigation: sign-up, login, onboarding.
 * A quiet top bar with the logo and one narrow left-aligned column for the task; on wide
 * screens optionally a panel beside it. Shared by the Keycloak theme and the app, so the
 * sign-up path looks like one product while it moves between the two.
 */
export function FlowLayout({ headerEnd, progress, footer, aside, children }: FlowLayoutProps) {
  return (
    <div className={styles.page} data-has-aside={aside !== undefined}>
      <div className={styles.primary}>
        <header className={styles.header}>
          <Logo variant="lockup" size={28} />
          {headerEnd}
        </header>
        <div className={styles.body}>
          {progress && <div className={styles.progress}>{progress}</div>}
          <main className={styles.main}>
            {children}
            {footer && <div className={styles.footer}>{footer}</div>}
          </main>
        </div>
      </div>
      {aside && (
        <aside className={styles.aside}>
          <div className={styles.asideContent}>{aside}</div>
        </aside>
      )}
    </div>
  );
}
