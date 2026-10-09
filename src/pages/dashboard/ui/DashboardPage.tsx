import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus } from 'lucide-react';
import { readSignupSession } from '../../../entities/account';
import { AppShell } from '../../../widgets/app-shell';
import { Button, Card } from '../../../shared/ui';
import styles from './DashboardPage.module.css';

/**
 * First-visit dashboard: no vacancies yet, so an encouraging empty card instead of an
 * empty table. The real dashboard (figures, pipeline) replaces the empty card later.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const firstName = readSignupSession()?.firstName;

  return (
    <AppShell>
      <div className={styles.page}>
        <header className={styles.intro}>
          <h1>{firstName ? `Welkom, ${firstName}` : 'Welkom'}</h1>
          <p className={styles.lead}>Je account is bevestigd — je kan direct aan de slag.</p>
        </header>
        <Card className={styles.empty}>
          <Briefcase className={styles.emptyIcon} size={28} aria-hidden="true" />
          <h2 className={styles.emptyTitle}>Nog geen vacatures</h2>
          <p className={styles.emptyText}>Zodra je een vacature plaatst, zie je hier je pipeline en kandidaten.</p>
          <Button type="button" className={styles.newVacancy} onClick={() => navigate('/vacancies/new')}>
            <Plus size={16} aria-hidden="true" />
            Nieuwe vacature
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
