import styles from './DotProgress.module.css';

export interface DotProgressProps {
  /** 1-based index of the current step; every dot up to and including it is filled. */
  current: number;
  total: number;
}

/** Dot progress for one-question-per-screen flows. Decorative — pair it with a text caption. */
export function DotProgress({ current, total }: DotProgressProps) {
  return (
    <div className={styles.dots} aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={styles.dot} data-on={index < current} />
      ))}
    </div>
  );
}
