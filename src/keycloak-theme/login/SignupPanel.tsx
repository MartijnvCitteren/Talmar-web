import { companyFromEmail } from '../../shared/lib/company-from-email';
import { IdBadge } from '../../shared/ui';
import type { I18n } from './i18n';
import type { SignupStep } from './signupSteps';
import styles from './SignupPanel.module.css';

export interface SignupPanelProps {
  step: Exclude<SignupStep, 'role'>;
  i18n: I18n;
  name?: string;
  email?: string;
  /** False while the address is on a public mail domain: no company to preview then. */
  isWorkEmail?: boolean;
}

const CAPTIONS = {
  details: 'signupPanelDetails',
  verify: 'signupPanelVerify',
  password: 'signupPanelPassword',
} as const;

/**
 * The wide-screen panel of the sign-up pages: the account being made, as an ID badge that
 * fills in step by step, and one line on what happens with it. The company is previewed from
 * the e-mail domain, the way the API names a new company.
 */
export function SignupPanel({ step, i18n, name, email, isWorkEmail = true }: SignupPanelProps) {
  const { msgStr } = i18n;
  const status =
    step === 'verify'
      ? ({ tone: 'attention', label: msgStr('signupBadgeMailSent') } as const)
      : step === 'password'
        ? ({ tone: 'passed', label: msgStr('signupBadgeVerified') } as const)
        : undefined;

  return (
    <>
      <IdBadge
        label={msgStr('signupBadgeLabel')}
        name={name}
        namePlaceholder={msgStr('signupBadgeNamePlaceholder')}
        // After step 1 Keycloak only tells these pages the address: it heads the badge then.
        heading={step === 'details' ? undefined : email}
        organisation={email && isWorkEmail ? companyFromEmail(email) : undefined}
        organisationPlaceholder={msgStr('signupBadgeCompanyPlaceholder')}
        fields={[
          ...(step === 'details'
            ? [{ label: msgStr('signupBadgeEmail'), placeholder: msgStr('registerPlaceholderEmail'), value: email }]
            : []),
          { label: msgStr('signupBadgeRole'), placeholder: msgStr('signupBadgeRolePlaceholder') },
        ]}
        status={status}
      />
      <p className={styles.caption}>{msgStr(CAPTIONS[step])}</p>
    </>
  );
}
