import { CircleCheck } from 'lucide-react';
import { Button } from '../../../shared/ui';
import styles from './PublishedConfirmation.module.css';

export interface PublishedConfirmationProps {
  vacancyTitle: string;
  onBackToOverview: () => void;
  onViewVacancy: () => void;
}

export function PublishedConfirmation({ vacancyTitle, onBackToOverview, onViewVacancy }: PublishedConfirmationProps) {
  return (
    <div className={styles.column}>
      <div className={styles.circle}>
        <CircleCheck size={28} aria-hidden="true" />
      </div>
      <h1>Vacature gepubliceerd</h1>
      <p>&ldquo;{vacancyTitle}&rdquo; staat live op je Taldo-pagina.</p>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onBackToOverview}>
          Terug naar overzicht
        </Button>
        <Button type="button" onClick={onViewVacancy}>
          Bekijk je vacature
        </Button>
      </div>
    </div>
  );
}
