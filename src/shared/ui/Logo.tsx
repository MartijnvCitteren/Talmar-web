import type { CSSProperties } from 'react';
import { WORDMARK_PATH } from './logo-wordmark';
import styles from './Logo.module.css';

/** The icon heights the design system allows (px). */
export type LogoSize = 28 | 48 | 72 | 112 | 168;

export interface LogoProps {
  /** `symbol` is the app icon alone; `lockup` pairs it with the "Talmar" wordmark. */
  variant?: 'symbol' | 'lockup';
  /** Height of the icon; the lockup is as high as the icon and grows to the right. */
  size?: LogoSize;
  className?: string;
}

/** The official Talmar icon (`design/talmar-logo/svg/talmar-icon.svg`): a "t" with a dot on a tile. */
function Icon() {
  return (
    <>
      <rect className={styles.tile} width="116" height="116" rx="29" />
      <path className={styles.glyph} d="M48 19 V71 C48 89 57 96 68 96 C74 96 79 94 82 90" />
      <path className={styles.glyph} d="M28 43 H59" />
      <circle className={styles.dotRing} cx="83" cy="43" r="13" />
      <circle className={styles.dot} cx="83" cy="43" r="10" />
    </>
  );
}

/**
 * Talmar logo, drawn inline from the official vectors rather than via <img>, so its colors come
 * from the design tokens and the wordmark (outlined paths) never waits on a webfont.
 */
export function Logo({ variant = 'symbol', size = 28, className }: LogoProps) {
  const isLockup = variant === 'lockup';
  const style = { '--logo-size': `${size}px` } as CSSProperties;

  return (
    <span
      className={[styles.logo, className].filter(Boolean).join(' ')}
      style={style}
      role="img"
      aria-label="Talmar"
    >
      <svg
        className={isLockup ? styles.lockup : styles.symbol}
        viewBox={isLockup ? '0 0 388 116' : '0 0 116 116'}
        aria-hidden="true"
        focusable="false"
      >
        <Icon />
        {isLockup && <path className={styles.wordmark} data-part="wordmark" d={WORDMARK_PATH} />}
      </svg>
    </span>
  );
}
