import { MailCheck } from 'lucide-react';
import type { PageProps } from 'keycloakify/login/pages/PageProps';
import type { KcContext } from '../KcContext';
import type { I18n } from '../i18n';
import Template from '../Template';
import page from './page.module.css';
import styles from './LoginVerifyEmail.module.css';

type LoginVerifyEmailProps = PageProps<Extract<KcContext, { pageId: 'login-verify-email.ftl' }>, I18n>;

/**
 * login-verify-email.ftl — the second sign-up step: wait for the mail and click its link.
 *
 * The link in the mail (url.loginAction) is what Keycloak also uses to send it again. The
 * address is the one thing on the page that matters, so it gets the weight: a typo there is
 * the most likely reason no mail arrives.
 */
export default function LoginVerifyEmail({ kcContext, i18n, doUseDefaultCss, classes }: LoginVerifyEmailProps) {
  const { url, user, realm, message } = kcContext;
  const { msg, msgStr } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      documentTitle={`${msgStr('emailVerifyTitle')} · ${realm.displayName || 'Taldo'}`}
      headerNode={msg('emailVerifyTitle')}
      // Keycloak's "you need to verify your e-mail" warning repeats this page; a resend
      // confirmation or an error is still worth showing.
      displayMessage={message?.type !== 'warning'}
      signupStep="verify"
    >
      <div className={page.intro}>
        <span className={styles.icon} aria-hidden="true">
          <MailCheck size={24} />
        </span>
        <h1>{msgStr('emailVerifyTitle')}</h1>
      </div>

      <div className={styles.sentTo}>
        <p className={page.lede}>{msgStr('verifyEmailSentTo')}</p>
        {user?.email && <p className={styles.address}>{user.email}</p>}
      </div>

      <p>{msgStr('verifyEmailInstruction')}</p>

      <div className={styles.resend}>
        <p className={styles.resendText}>{msgStr('verifyEmailNoMail')}</p>
        <a href={url.loginAction} className={styles.resendLink}>
          {msgStr('verifyEmailResend')}
        </a>
      </div>
    </Template>
  );
}
