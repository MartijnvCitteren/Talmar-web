import styles from './PendingApproval.module.css';

/**
 * After onboarding into a company that already uses Taldo: the account exists, but the
 * company's owner still has to let the user in (`PENDING_APPROVAL`).
 */
export function PendingApproval() {
  return (
    <div className={styles.pending}>
      <p className={styles.badge}>
        <span className={styles.shape} aria-hidden="true" />
        Wacht op goedkeuring
      </p>
      <h1>Je bedrijf moet je nog toelaten</h1>
      <p className={styles.body}>
        Je bedrijf gebruikt Taldo al. Je account is klaar; zodra de beheerder van jullie bedrijfsaccount je toelaat, kun je
        aan de slag.
      </p>
    </div>
  );
}
