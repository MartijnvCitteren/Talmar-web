import { Suspense, lazy } from 'react';
import type { ClassKey } from 'keycloakify/login';
import DefaultPage from 'keycloakify/login/DefaultPage';
import DefaultTemplate from './KeycloakTemplate';
import type { KcContext } from './KcContext';
import { useI18n } from './i18n';
import '../../app/styles/tokens.css';
import './fallback.css';

const UserProfileFormFields = lazy(() => import('keycloakify/login/UserProfileFormFields'));
const Register = lazy(() => import('./pages/Register'));
const LoginVerifyEmail = lazy(() => import('./pages/LoginVerifyEmail'));
const LoginUpdatePassword = lazy(() => import('./pages/LoginUpdatePassword'));
const Info = lazy(() => import('./pages/Info'));

export default function KcPage({ kcContext }: { kcContext: KcContext }) {
  const { i18n } = useI18n({ kcContext });
  // Props every ejected page takes; they render in the Taldo Template, without Keycloak's CSS.
  const ejected = { i18n, classes, Template: DefaultTemplate, doUseDefaultCss: false } as const;

  return (
    <Suspense>
      {(() => {
        switch (kcContext.pageId) {
          case 'register.ftl':
            return (
              <Register
                kcContext={kcContext}
                i18n={i18n}
                classes={classes}
                Template={DefaultTemplate}
                doUseDefaultCss={false}
              />
            );
          case 'login-verify-email.ftl':
            return <LoginVerifyEmail {...ejected} kcContext={kcContext} />;
          case 'login-update-password.ftl':
            return <LoginUpdatePassword {...ejected} kcContext={kcContext} />;
          case 'info.ftl':
            return <Info {...ejected} kcContext={kcContext} />;
          default:
            // Pages not ejected yet keep Keycloak's markup; fallback.css brings them on brand.
            return (
              <DefaultPage
                kcContext={kcContext}
                i18n={i18n}
                classes={classes}
                Template={DefaultTemplate}
                doUseDefaultCss={true}
                UserProfileFormFields={UserProfileFormFields}
                doMakeUserConfirmPassword={true}
              />
            );
        }
      })()}
    </Suspense>
  );
}

const classes = {} satisfies { [key in ClassKey]?: string };
