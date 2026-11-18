import { workplaceTypeLabels, formatSalary, formatHoursPerWeek, type VacancyResponse } from '../../../entities/vacancy';
import { countries } from '../../../entities/location';
import type { VacancyDescriptionResponse } from '../../../entities/vacancy-description';
import { Button, Card, Logo } from '../../../shared/ui';
import styles from './VacancyPreview.module.css';

export interface VacancyPreviewProps {
  vacancy: VacancyResponse;
  description?: VacancyDescriptionResponse;
  onBack: () => void;
  onSaveDraft: () => void;
  onRequestPublish: () => void;
}

function countryLabel(code: string): string {
  return countries.find((country) => country.code === code)?.labelNl ?? code;
}

export function VacancyPreview({ vacancy, description, onBack, onSaveDraft, onRequestPublish }: VacancyPreviewProps) {
  return (
    <div>
      <div className={styles.pageHeader}>
        <p className={styles.breadcrumb}>Stap 4 van 4 · voorvertoning</p>
        <h1>Zo ziet een sollicitant je vacature</h1>
      </div>

      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <Logo />
            Geplaatst via Taldo
          </div>
          <div className={styles.jobTitle}>{vacancy.jobTitle}</div>
          <div className={styles.chips}>
            <span className={styles.chip}>
              {vacancy.location.city}, {countryLabel(vacancy.location.country)}
            </span>
            <span className={styles.chip}>{workplaceTypeLabels[vacancy.workplaceType]}</span>
            <span className={`${styles.chip} ${styles.mono}`}>
              {/* minHoursPerWeek/maxHoursPerWeek are optional on VacancyResponse for schema laxity only — always set once a vacancy exists, required by VacancyCoreRequest at creation. */}
              {formatHoursPerWeek(vacancy.minHoursPerWeek ?? 0, vacancy.maxHoursPerWeek ?? 0)}
            </span>
            <span className={`${styles.chip} ${styles.mono}`}>{formatSalary(vacancy.offer)}</span>
          </div>
        </div>

        <div className={styles.body}>
          {description?.summary && <p className={styles.summary}>{description.summary}</p>}

          {description?.jobDescription && (
            <div>
              <div className={styles.sectionHeading}>Over de rol</div>
              <p className={styles.sectionBody}>{description.jobDescription}</p>
            </div>
          )}

          {description?.tasks && (
            <div>
              <div className={styles.sectionHeading}>Wat je gaat doen</div>
              <p className={styles.sectionBody}>{description.tasks}</p>
            </div>
          )}

          <div>
            <div className={styles.sectionHeading}>Voorwaarden</div>
            <p className={`${styles.sectionBody} ${styles.mono}`}>{formatSalary(vacancy.offer)}</p>
          </div>

          <div className={styles.contactSection}>
            <p>Vragen over deze rol?</p>
            {vacancy.contactPerson && (
              <p>
                {vacancy.contactPerson.name} · {vacancy.contactPerson.email}
              </p>
            )}
            <Button type="button" variant="secondary" disabled>
              Solliciteren
            </Button>
          </div>
        </div>
      </Card>

      <div className={styles.footer}>
        <Button type="button" variant="text" onClick={onBack}>
          Terug
        </Button>
        <Button type="button" variant="secondary" className={styles.saveDraftButton} onClick={onSaveDraft}>
          Bewaren als concept
        </Button>
        <Button type="button" onClick={onRequestPublish}>
          Publiceer vacature
        </Button>
      </div>
    </div>
  );
}
