import { useState, type FormEvent } from 'react';
import type { PageProps } from 'keycloakify/login/pages/PageProps';
import { Button, Checkbox, PasswordField } from '../../../shared/ui';
import type { KcContext } from '../KcContext';
import type { I18n } from '../i18n';
import Template from '../Template';
import page from './page.module.css';
import styles from './LoginUpdatePassword.module.css';

type LoginUpdatePasswordProps = PageProps<Extract<KcContext, { pageId: 'login-update-password.ftl' }>, I18n>;

/**
 * login-update-password.ftl — the third sign-up step. With e-mail verification on, Keycloak
 * asks for the password here, right after the link in the mail is clicked (taldo-api ADR 0006).
 *
 * The same page serves a password change the app asks for (isAppInitiatedAction) and a reset;
 * only first-time sign-up shows the sign-up steps. The realm's password policy is checked by
 * Keycloak on submit; this page only catches an empty field and two passwords that differ.
 */
export default function LoginUpdatePassword({
  kcContext,
  i18n,
  doUseDefaultCss,
  classes,
}: LoginUpdatePasswordProps) {
  const { url, realm, messagesPerField, isAppInitiatedAction, auth } = kcContext;
  const { msg, msgStr } = i18n;

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [logoutOtherSessions, setLogoutOtherSessions] = useState(false);
  const [clientErrors, setClientErrors] = useState<{ password?: string; confirmation?: string }>({});

  const serverError = (field: string) =>
    messagesPerField.existsError(field) ? toText(messagesPerField.get(field)) : undefined;
  const passwordError = clientErrors.password ?? serverError('password');
  const confirmationError = clientErrors.confirmation ?? serverError('password-confirm');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name === 'cancel-aia') {
      return;
    }
    const errors = {
      password: password === '' ? msgStr('missingPasswordMessage') : undefined,
      confirmation:
        password !== '' && confirmation !== password ? msgStr('notMatchPasswordMessage') : undefined,
    };
    setClientErrors(errors);
    if (errors.password || errors.confirmation) {
      event.preventDefault();
      document.getElementById(errors.password ? 'password-new' : 'password-confirm')?.focus();
    }
    // Otherwise the browser posts the form to Keycloak.
  };

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      documentTitle={`${msgStr('updatePasswordTitle')} · ${realm.displayName || 'Taldo'}`}
      headerNode={msg('updatePasswordTitle')}
      displayMessage={!messagesPerField.existsError('password', 'password-confirm')}
      signupStep={isAppInitiatedAction ? undefined : 'password'}
    >
      <div className={page.intro}>
        <h1>{msgStr('updatePasswordTitle')}</h1>
        {!isAppInitiatedAction && <p className={page.lede}>{msgStr('updatePasswordLede')}</p>}
      </div>

      <form id="kc-passwd-update-form" className={page.form} action={url.loginAction} method="post" noValidate onSubmit={onSubmit}>
        {/* Lets password managers save the new password under the right account. */}
        {auth?.attemptedUsername && (
          <input type="text" name="username" value={auth.attemptedUsername} autoComplete="username" readOnly hidden />
        )}
        <PasswordField
          id="password-new"
          name="password-new"
          label={msgStr('passwordNew')}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          helperText={msgStr('updatePasswordHint')}
          error={passwordError}
          toggleLabels={{ show: msgStr('showPassword'), hide: msgStr('hidePassword') }}
        />
        <PasswordField
          id="password-confirm"
          name="password-confirm"
          label={msgStr('passwordConfirm')}
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
          required
          error={confirmationError}
          toggleLabels={{ show: msgStr('showPassword'), hide: msgStr('hidePassword') }}
        />
        {isAppInitiatedAction && (
          <Checkbox
            name="logout-sessions"
            label={msgStr('logoutOtherSessions')}
            checked={logoutOtherSessions}
            onChange={setLogoutOtherSessions}
          />
        )}

        <div className={styles.actions}>
          <Button type="submit" className={page.submit}>
            {msgStr(isAppInitiatedAction ? 'doSubmit' : 'updatePasswordSubmit')}
          </Button>
          {isAppInitiatedAction && (
            <Button type="submit" variant="secondary" name="cancel-aia" value="true" className={page.submit}>
              {msgStr('doCancel')}
            </Button>
          )}
        </div>
      </form>
    </Template>
  );
}

/** Keycloak field messages arrive as HTML (entities); show them as plain text. */
function toText(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
}
