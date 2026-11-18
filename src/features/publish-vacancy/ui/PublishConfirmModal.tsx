import { Modal, Button, ErrorBanner } from '../../../shared/ui';
import { usePublishVacancy } from '../lib/usePublishVacancy';
import type { VacancyResponse } from '../../../entities/vacancy';
import styles from './PublishConfirmModal.module.css';

export interface PublishConfirmModalProps {
  open: boolean;
  vacancyId: string;
  vacancyTitle: string;
  onClose: () => void;
  onPublished: (vacancy: VacancyResponse) => void;
}

export function PublishConfirmModal({ open, vacancyId, vacancyTitle, onClose, onPublished }: PublishConfirmModalProps) {
  const { publish, publishing, error } = usePublishVacancy();

  async function handleConfirm() {
    try {
      const published = await publish(vacancyId);
      onPublished(published);
    } catch {
      // error state already surfaced via the hook, modal stays open
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Vacature publiceren?" maxWidth={440}>
      <p>
        &ldquo;{vacancyTitle}&rdquo; gaat live op je Taldo-pagina en de gekoppelde kanalen. Je kunt de
        vacature daarna nog aanpassen of pauzeren.
      </p>
      <ErrorBanner message={error} />
      <div className={styles.footer}>
        <Button type="button" variant="text" onClick={onClose}>
          Annuleren
        </Button>
        <Button type="button" disabled={publishing} onClick={handleConfirm}>
          Ja, publiceer
        </Button>
      </div>
    </Modal>
  );
}
