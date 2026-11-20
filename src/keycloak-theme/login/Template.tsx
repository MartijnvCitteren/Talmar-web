import { useEffect, type ReactNode } from 'react';
import type { TemplateProps } from 'keycloakify/login/TemplateProps';
import { useInitialize } from 'keycloakify/login/Template.useInitialize';
import { kcSanitize } from 'keycloakify/lib/kcSanitize';
import { ErrorBanner, FlowLayout, ProgressRail } from '../../shared/ui';
import type { I18n } from './i18n';
import type { KcContext } from './KcContext';
import { signupSteps, type SignupStep } from './signupSteps';
import styles from './Template.module.css';

export type TaldoTemplateProps = TemplateProps<KcContext, I18n> & {
  /** The sign-up step this page is, if it is part of sign-up: shows the steps next to the page. */
  signupStep?: SignupStep;
  /** Below the page, e.g. the link back to login. */
  footer?: ReactNode;
  /** The wide-screen panel beside the page, e.g. the sign-up badge (SignupPanel). */
  aside?: ReactNode;
};

/**
 * The Taldo shell for Keycloak pages: logo and language links on top, the global message and
 * the page in one column, and the sign-up steps next to it on sign-up pages. Pages that aren't
 * ejected use Keycloakify's own Template instead (see KcPage).
 */
export default function Template({
  displayMessage = true,
  documentTitle,
  kcContext,
  i18n,
  doUseDefaultCss,
  children,
  signupStep,
  footer,
  aside,
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

  const languages =
    enabledLanguages.length > 1 ? (
      <nav aria-label={msgStr('languages')}>
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
    ) : undefined;

  const steps = signupSteps(i18n);
  const progress =
    signupStep === undefined ? undefined : (
      <ProgressRail
        steps={steps.map(({ label }) => label)}
        currentIndex={steps.findIndex(({ id }) => id === signupStep)}
        label={msgStr('signupProgressLabel')}
        summary={msgStr(
          'signupProgressSummary',
          String(steps.findIndex(({ id }) => id === signupStep) + 1),
          String(steps.length),
          steps.find(({ id }) => id === signupStep)?.label ?? '',
        )}
      />
    );

  return (
    <FlowLayout headerEnd={languages} progress={progress} footer={footer} aside={aside}>
      {showMessage &&
        (message.type === 'error' ? (
          <ErrorBanner message={toText(message.summary)} />
        ) : (
          <p className={styles.notice} role="status">
            {toText(message.summary)}
          </p>
        ))}
      {children}
    </FlowLayout>
  );
}

/** Keycloak messages arrive as HTML (entities, sometimes markup); show them as plain text. */
function toText(html: string): string {
  return new DOMParser().parseFromString(kcSanitize(html), 'text/html').body.textContent ?? '';
}
