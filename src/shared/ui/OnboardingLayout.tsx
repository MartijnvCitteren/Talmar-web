import type { ReactNode } from 'react';
import styles from './OnboardingLayout.module.css';

export interface OnboardingLayoutProps {
  /** Left side of the top bar — the logo on a first screen, a back button after that. */
  leading: ReactNode;
  /** Right side of the top bar, e.g. "Stap 2 van 4". */
  caption?: string;
  children: ReactNode;
}

/** Focused, nav-less frame for onboarding flows: a top bar and one centred narrow column. */
export function OnboardingLayout({ leading, caption, children }: OnboardingLayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          {leading}
          {caption && <span className={styles.caption}>{caption}</span>}
        </div>
      </header>
      <main className={styles.body}>
        <div className={styles.column}>{children}</div>
      </main>
    </div>
  );
}
