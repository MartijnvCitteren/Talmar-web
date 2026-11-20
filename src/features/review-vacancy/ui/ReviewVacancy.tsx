import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  categoryLabels,
  languageLabels,
  workplaceTypeLabels,
  formatSalary,
  formatHoursPerWeek,
  formatHolidayDays,
  fromAnnualHolidayDays,
  type HolidayPeriod,
  type VacancyResponse,
} from '../../../entities/vacancy';
import {
  descriptionApi,
  type VacancyDescriptionResponse,
} from '../../../entities/vacancy-description';
import type { ApiError } from '../../../shared/api';
import { toUserMessage } from '../../../shared/lib/problem-details';
import { Button, Card, CardHeader, ErrorBanner, Skeleton, TextField } from '../../../shared/ui';
import styles from './ReviewVacancy.module.css';

export type ReviewVacancyGenerationPhase = 'idle' | 'generating' | 'ready' | 'failed';
export type ReviewVacancyRegeneratableSection = 'summary' | 'jobDescription' | 'tasks';

/**
 * Mirrors `edit-vacancy-contact-offer`'s `HolidayInput` shape locally rather than
 * importing it — features don't import each other's internals (§10.3). The page threads
 * the same value from its single `onHolidayInputChange` callback via this prop.
 */
export interface ReviewVacancyHolidayInput {
  amount: number;
  period: HolidayPeriod;
}

export interface ReviewVacancyProps {
  vacancyId: string;
  vacancy: VacancyResponse;
  description?: VacancyDescriptionResponse;
  mode: 'manual' | 'ai' | null;
  phase?: ReviewVacancyGenerationPhase;
  /** Why the AI draft could not be made, shown when `phase` is `failed`. */
  generationError?: string;
  /** The vakantiedagen amount/period the user actually entered (ADR-0005), preferred over reconstructing from the converted annual figure. */
  holidayInput?: ReviewVacancyHolidayInput;
  onDescriptionSaved: (description: VacancyDescriptionResponse) => void;
  onRegenerate?: (section: ReviewVacancyRegeneratableSection) => void;
  onNavigateToStep: (step: number) => void;
  onViewPreview: () => void;
}

const emptyDescription: Required<Pick<VacancyDescriptionResponse, 'summary' | 'jobDescription' | 'tasks'>> = {
  summary: '',
  jobDescription: '',
  tasks: '',
};

const sectionLabels: Record<ReviewVacancyRegeneratableSection, string> = {
  summary: 'Samenvatting',
  jobDescription: 'Over de rol',
  tasks: 'Taken',
};

const sectionMultiline: Record<ReviewVacancyRegeneratableSection, boolean> = {
  summary: false,
  jobDescription: true,
  tasks: true,
};

function holidayDaysLine(vacancy: VacancyResponse, holidayInput?: ReviewVacancyHolidayInput): string | undefined {
  if (holidayInput) {
    return formatHolidayDays(holidayInput.amount, holidayInput.period);
  }
  const annual = vacancy.offer?.numberOfHolidays;
  if (annual == null) {
    return undefined;
  }
  return formatHolidayDays(fromAnnualHolidayDays(annual, 'ANNUAL'), 'ANNUAL');
}

export function ReviewVacancy({
  vacancyId,
  vacancy,
  description,
  mode,
  phase = 'idle',
  generationError,
  holidayInput,
  onDescriptionSaved,
  onRegenerate,
  onNavigateToStep,
  onViewPreview,
}: ReviewVacancyProps) {
  const [values, setValues] = useState({ ...emptyDescription, ...description });
  const [editingSection, setEditingSection] = useState<ReviewVacancyRegeneratableSection | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (description) {
      setValues((prev) => ({ ...prev, ...description }));
    }
  }, [description]);

  const stillGenerating = mode === 'ai' && phase === 'generating' && !description;

  function startEditing(section: ReviewVacancyRegeneratableSection) {
    setDraftValue(values[section]);
    setEditingSection(section);
  }

  function cancelEditing() {
    setEditingSection(null);
  }

  async function saveSection(section: ReviewVacancyRegeneratableSection) {
    setError(undefined);
    setSaving(true);
    try {
      const saved = await descriptionApi.saveDescription(vacancyId, { ...values, [section]: draftValue });
      setValues((prev) => ({ ...prev, ...saved }));
      onDescriptionSaved(saved);
      setEditingSection(null);
    } catch (caught) {
      const apiError = caught as ApiError;
      setError(
        toUserMessage(apiError, {
          fallback: 'Opslaan van de vacaturetekst is niet gelukt. Probeer het zo nog eens.',
          byStatus: {
            400: 'De tekst bevat iets wat we niet kunnen opslaan, zoals HTML-tags, of is te lang. Pas de tekst aan en probeer het opnieuw.',
          },
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleViewPreview() {
    setError(undefined);
    setSaving(true);
    try {
      const saved = await descriptionApi.saveDescription(vacancyId, values);
      onDescriptionSaved(saved);
      onViewPreview();
    } catch (caught) {
      const apiError = caught as ApiError;
      setError(
        toUserMessage(apiError, {
          fallback: 'Opslaan van de vacaturetekst is niet gelukt. Probeer het zo nog eens.',
          byStatus: {
            400: 'De tekst bevat iets wat we niet kunnen opslaan, zoals HTML-tags, of is te lang. Pas de tekst aan en probeer het opnieuw.',
          },
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  function renderSection(section: ReviewVacancyRegeneratableSection) {
    const label = sectionLabels[section];
    const isEditing = editingSection === section;

    return (
      <div key={section}>
        <div className={styles.sectionHeader}>
          <h3>{label}</h3>
          <div className={styles.sectionActions}>
            {mode === 'ai' && onRegenerate && (
              <button type="button" className={styles.regenerateButton} onClick={() => onRegenerate(section)}>
                <RefreshCw size={13} aria-hidden="true" />
                Opnieuw
              </button>
            )}
            {isEditing ? (
              <>
                <button type="button" className={styles.linkButton} onClick={cancelEditing}>
                  Annuleren
                </button>
                <button
                  type="button"
                  className={styles.linkButton}
                  disabled={saving}
                  onClick={() => saveSection(section)}
                >
                  Opslaan
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.linkButton}
                aria-label={`Aanpassen ${label}`}
                onClick={() => startEditing(section)}
              >
                Aanpassen
              </button>
            )}
          </div>
        </div>
        {isEditing ? (
          <TextField
            label={label}
            hideLabel
            value={draftValue}
            onChange={setDraftValue}
            multiline={sectionMultiline[section]}
          />
        ) : values[section] ? (
          <p className={styles.sectionValue}>{values[section]}</p>
        ) : (
          <p className={styles.sectionPlaceholder}>Nog niet ingevuld</p>
        )}
      </div>
    );
  }

  const holidaysLine = holidayDaysLine(vacancy, holidayInput);
  const contactLine = [
    vacancy.contactPerson?.name,
    vacancy.contactPerson?.role,
    vacancy.contactPerson?.phone,
    vacancy.contactPerson?.email,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <Card>
        <CardHeader
          title="Overzicht"
          description="Alles staat er. Pas aan wat nog niet klopt — elk onderdeel blijft bewerkbaar tot je publiceert."
        />

        <div className={styles.header}>
          <div>
            <div className={styles.title}>{vacancy.jobTitle}</div>
            <div className={styles.meta}>
              {categoryLabels[vacancy.category]} · {vacancy.location.city} ·{' '}
              {workplaceTypeLabels[vacancy.workplaceType]} ·{' '}
              {/* minHoursPerWeek/maxHoursPerWeek are optional on VacancyResponse for schema laxity only — always set once a vacancy exists, required by VacancyCoreRequest at creation. */}
              {formatHoursPerWeek(vacancy.minHoursPerWeek ?? 0, vacancy.maxHoursPerWeek ?? 0)}
              {vacancy.language && <> · {languageLabels[vacancy.language]}</>}
            </div>
          </div>
          <button
            type="button"
            className={styles.linkButton}
            aria-label="Aanpassen basisgegevens"
            onClick={() => onNavigateToStep(1)}
          >
            Aanpassen
          </button>
        </div>

        {stillGenerating ? (
          <div className={styles.skeletons}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="100%" height={10} />
            <Skeleton width="88%" height={10} />
            <Skeleton width="94%" height={10} />
          </div>
        ) : (
          <>
            <ErrorBanner message={error} />
            {mode === 'ai' && phase === 'failed' && !description && <ErrorBanner message={generationError} />}
            {renderSection('summary')}
            {renderSection('jobDescription')}
            {renderSection('tasks')}
          </>
        )}

        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.header}>
          <h3>Contact en voorwaarden</h3>
          <button
            type="button"
            className={styles.linkButton}
            aria-label="Aanpassen contact en voorwaarden"
            onClick={() => onNavigateToStep(3)}
          >
            Aanpassen
          </button>
        </div>
        <div className={styles.contactDetails}>
          <p className={styles.contactLine}>{contactLine}</p>
          <p className={styles.salaryLine}>{formatSalary(vacancy.offer)}</p>
          {holidaysLine && <p className={styles.holidaysLine}>{holidaysLine}</p>}
        </div>

        <div className={styles.footer}>
          <Button
            type="button"
            disabled={saving || stillGenerating || editingSection !== null}
            onClick={handleViewPreview}
          >
            Bekijk je vacature
          </Button>
        </div>
      </Card>
    </div>
  );
}
