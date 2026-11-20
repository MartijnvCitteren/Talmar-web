import type { PageProps } from 'keycloakify/login/pages/PageProps';
import { kcSanitize } from 'keycloakify/lib/kcSanitize';
import type { KcContext } from '../KcContext';
import type { I18n } from '../i18n';
import Template from '../Template';
import page from './page.module.css';
import styles from './Info.module.css';

type InfoProps = PageProps<Extract<KcContext, { pageId: 'info.ftl' }>, I18n>;

/**
 * info.ftl — Keycloak's page for a message with at most one way on. During sign-up it shows up
 * when the link in the mail is opened in another browser than the one used to register (e.g. a
 * mail app's built-in browser): "confirm this is your address", then on to the password.
 */
export default function Info({ kcContext, i18n, doUseDefaultCss, classes }: InfoProps) {
  const { messageHeader, message, requiredActions, skipLink, pageRedirectUri, actionUri, client, realm } = kcContext;
  const { msgStr, advancedMsgStr } = i18n;

  const title = toText(messageHeader ? advancedMsgStr(messageHeader) : msgStr('infoTitle'));
  const action = skipLink
    ? undefined
    : pageRedirectUri
      ? { href: pageRedirectUri, label: msgStr('backToApplication') }
      : actionUri
        ? { href: actionUri, label: msgStr('proceedWithAction') }
        : client.baseUrl
          ? { href: client.baseUrl, label: msgStr('backToApplication') }
          : undefined;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      documentTitle={`${title} · ${realm.displayName || 'Taldo'}`}
      headerNode={title}
      displayMessage={false}
    >
      <div className={page.intro}>
        <h1>{title}</h1>
        <p className={page.lede}>{toText(message.summary)}</p>
      </div>

      {requiredActions && requiredActions.length > 0 && (
        <ul className={styles.actions}>
          {requiredActions.map((requiredAction) => (
            <li key={requiredAction}>{advancedMsgStr(`requiredAction.${requiredAction}`)}</li>
          ))}
        </ul>
      )}

      {action && (
        // A link styled as the primary button: it navigates, it doesn't submit.
        <a href={action.href} className={styles.button}>
          {action.label}
        </a>
      )}
    </Template>
  );
}

/** Keycloak messages arrive as HTML (entities, sometimes markup); show them as plain text. */
function toText(html: string): string {
  return new DOMParser().parseFromString(kcSanitize(html), 'text/html').body.textContent ?? '';
}
