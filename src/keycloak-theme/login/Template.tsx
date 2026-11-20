import { useEffect, type ReactNode } from 'react';
import type { TemplateProps } from 'keycloakify/login/TemplateProps';
import { useInitialize } from 'keycloakify/login/Template.useInitialize';
import { kcSanitize } from 'keycloakify/lib/kcSanitize';
import { ErrorBanner, Logo } from '../../shared/ui';
import type { I18n } from './i18n';
import type { KcContext } from './KcContext';
import styles from './Template.module.css';

export type TaldoTemplateProps = TemplateProps<KcContext, I18n> & {
  /** Left of the header bar; defaults to the Taldo lockup. */
  headerStart?: ReactNode;
  /** Right of the header bar, e.g. a step counter. */
  headerEnd?: ReactNode;
  /** Below the card's content, e.g. the link back to login. */
  footer?: ReactNode;
};

/**
 * The Taldo shell for Keycloak pages: one card with a header bar, the global message and the
 * page. Pages that are ejected into this theme (register now; login and reset-password next)
 * render inside it. Pages that aren't ejected use Keycloakify's own Template (see KcPage).
 */
export default function Template({
  displayMessage = true,
  documentTitle,
  kcContext,
  i18n,
  doUseDefaultCss,
  children,
  headerStart,
  headerEnd,
  footer,
}: TaldoTemplateProps) {
  const { msgStr, currentLanguage, enabledLanguages } = i18n;
  const { realm, message, isAppInitiatedAction } = kcContext;

  useEffect(() => {
    document.title = documentTitle ?? msgStr('loginTitle', realm.displayName || realm.name);
  }, [documentTitle, msgStr, realm.displayName, realm.name]);

  useEffect(() => {
    document.documentElement.lang = currentLanguage.languageTag;
  }, [currentLanguage.languageTag]);

  // Loads Keycloak's page scripts (session polling, and reCAPTCHA when the realm requires it).
  const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss });
  if (!isReadyToRender) {
    return null;
  }

  // App-initiated actions should not see warnings about the action they are completing.
  const showMessage =
    displayMessage && message !== undefined && (message.type !== 'warning' || !isAppInitiatedAction);

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <header className={styles.header}>
          {headerStart ?? <Logo variant="lockup" size={28} />}
          {headerEnd}
        </header>
        <div className={styles.body}>
          {showMessage &&
            (message.type === 'error' ? (
              <ErrorBanner message={toText(message.summary)} />
            ) : (
              <p className={styles.notice} role="status">
                {toText(message.summary)}
              </p>
            ))}
          {children}
          {footer}
        </div>
      </main>
      {enabledLanguages.length > 1 && (
        <nav className={styles.languages} aria-label={msgStr('languages')}>
          <ul className={styles.languageList}>
            {enabledLanguages.map(({ languageTag, label, href }) => (
              <li key={languageTag}>
                <a
                  href={href}
                  lang={languageTag}
                  className={styles.languageLink}
                  aria-current={languageTag === currentLanguage.languageTag ? 'true' : undefined}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

/** Keycloak messages arrive as HTML (entities, sometimes markup); show them as plain text. */
function toText(html: string): string {
  return new DOMParser().parseFromString(kcSanitize(html), 'text/html').body.textContent ?? '';
}
