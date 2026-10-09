import { Button } from '../../../shared/ui';
import { useResendVerification } from '../lib/useResendVerification';
import { useVerificationPolling } from '../lib/useVerificationPolling';
import illusMailSent from '../assets/illus-mail-sent.jpeg';
import styles from './CheckYourMail.module.css';

export interface CheckYourMailProps {
  accountId: string;
  /** Called once the account owner has clicked the link in the verification mail. */
  onVerified: () => void;
}

export function CheckYourMail({ accountId, onVerified }: CheckYourMailProps) {
  useVerificationPolling(accountId, onVerified);
  const { canResend, resending, resend, notice } = useResendVerification(accountId);

  return (
    <div className={styles.panel}>
      <img
        className={styles.illustration}
        src={illusMailSent}
        alt="Illustratie: iemand bij een verzonden envelop met vinkje"
      />
      <h1 className={styles.title}>Check je mail</h1>
      <p className={styles.helper}>we stuurden een link naar je werk e-mail — klik erop om verder te gaan</p>
      {canResend && (
        <Button type="button" variant="text" disabled={resending} onClick={() => void resend()}>
          Mail nog eens sturen
        </Button>
      )}
      <p className={styles.notice} data-kind={notice?.kind} role="status">
        {notice?.message}
      </p>
    </div>
  );
}
