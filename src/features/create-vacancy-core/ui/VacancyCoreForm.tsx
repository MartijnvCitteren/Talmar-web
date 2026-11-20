import { useState } from 'react';
import {
  categoryOptions,
  languageOptions,
  vacancyApi,
  workplaceTypeOptions,
  type Language,
  type VacancyCategory,
  type VacancyCoreRequest,
  type VacancyResponse,
  type WorkplaceType,
} from '../../../entities/vacancy';
import { countrySelectOptions } from '../../../entities/location';
import { toFieldErrors, toUserMessage } from '../../../shared/lib/problem-details';
import type { ApiError } from '../../../shared/api';
import {
  Button,
  Card,
  CardHeader,
  ErrorBanner,
  NumberField,
  Select,
  SegmentedControl,
  TextField,
} from '../../../shared/ui';
import styles from './VacancyCoreForm.module.css';

export interface VacancyCoreFormValues {
  jobTitle: string;
  language: Language;
  category: VacancyCategory | '';
  country: string;
  city: string;
  workplaceType: WorkplaceType;
  minHoursPerWeek: number | '';
  maxHoursPerWeek: number | '';
}

export interface VacancyCoreFormProps {
  vacancyId: string | null;
  initialValues?: Partial<VacancyCoreFormValues>;
  onSaved: (vacancy: VacancyResponse) => void;
  /** Called in addition to onSaved when the user clicks "Volgende" (not "Bewaren als concept"). */
  onNext?: (vacancy: VacancyResponse) => void;
}

const emptyValues: VacancyCoreFormValues = {
  jobTitle: '',
  language: 'NL',
  category: '',
  country: '',
  city: '',
  workplaceType: 'ONSITE',
  minHoursPerWeek: '',
  maxHoursPerWeek: '',
};

function validate(values: VacancyCoreFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.jobTitle.trim().length < 2) {
    errors.jobTitle = 'Functietitel is verplicht.';
  }
  if (!values.category) {
    errors.category = 'Categorie is verplicht.';
  }
  if (!values.country) {
    errors.country = 'Land is verplicht.';
  }
  if (!values.city.trim()) {
    errors.city = 'Stad is verplicht.';
  }
  if (values.minHoursPerWeek === '' || values.minHoursPerWeek < 0 || values.minHoursPerWeek > 60) {
    errors.minHoursPerWeek = 'Vul een geldig minimum aantal uren in (0-60).';
  }
  if (values.maxHoursPerWeek === '' || values.maxHoursPerWeek <= 1 || values.maxHoursPerWeek > 60) {
    errors.maxHoursPerWeek = 'Vul een geldig maximum aantal uren in (>1-60).';
  } else if (values.minHoursPerWeek !== '' && values.minHoursPerWeek > values.maxHoursPerWeek) {
    errors.maxHoursPerWeek = 'Het maximum moet minstens zo hoog zijn als het minimum.';
  }
  return errors;
}

/** Dutch messages for fields the API rejects, keyed by the last segment of the API's field path. */
const apiFieldMessages: Record<string, string> = {
  jobTitle: 'Gebruik 2 tot 100 tekens voor de functietitel.',
  language: 'Kies de taal van de vacature.',
  category: 'Kies een categorie.',
  country: 'Kies een land.',
  city: 'Vul een stad in van maximaal 200 tekens.',
  workplaceType: 'Kies een type werkplek.',
  minHoursPerWeek: 'Vul een geldig minimum aantal uren in (0-60).',
  maxHoursPerWeek: 'Vul een geldig maximum aantal uren in (>1-60).',
};

function toRequest(values: VacancyCoreFormValues): VacancyCoreRequest {
  return {
    jobTitle: values.jobTitle.trim(),
    language: values.language,
    category: values.category as VacancyCategory,
    location: { country: values.country, city: values.city.trim() },
    workplaceType: values.workplaceType,
    minHoursPerWeek: values.minHoursPerWeek as number,
    maxHoursPerWeek: values.maxHoursPerWeek as number,
  };
}

export function VacancyCoreForm({ vacancyId, initialValues, onSaved, onNext }: VacancyCoreFormProps) {
  const [values, setValues] = useState<VacancyCoreFormValues>({ ...emptyValues, ...initialValues });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [topLevelError, setTopLevelError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof VacancyCoreFormValues>(key: K, value: VacancyCoreFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save(advance: boolean) {
    const errors = validate(values);
    setFieldErrors(errors);
    setTopLevelError(undefined);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const request = toRequest(values);
      // The first save creates the draft; every later save (after "Aanpassen" in the overview,
      // or a second "Bewaren als concept") updates that same draft instead of creating another.
      const vacancy = vacancyId
        ? await vacancyApi.patchVacancyCore(vacancyId, request)
        : await vacancyApi.createVacancy(request);
      onSaved(vacancy);
      if (advance) {
        onNext?.(vacancy);
      }
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 400 && apiError.errors?.length) {
        setFieldErrors(toFieldErrors(apiError.errors, apiFieldMessages));
      } else {
        setTopLevelError(
          toUserMessage(apiError, {
            fallback: 'Opslaan is niet gelukt. Probeer het zo nog eens.',
            byStatus: { 400: 'Niet alle gegevens kloppen nog. Kijk de velden even na.' },
          }),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Basisgegevens"
        description="Deze velden bepalen waar je vacature terechtkomt en hoe kandidaten hem vinden."
      />
      <ErrorBanner message={topLevelError} />
      <TextField
        label="Functietitel"
        value={values.jobTitle}
        onChange={(value) => setField('jobTitle', value)}
        error={fieldErrors.jobTitle}
        maxLength={100}
      />
      <Select
        label="Taal van de vacature"
        value={values.language}
        onChange={(value) => setField('language', value as Language)}
        options={languageOptions}
        error={fieldErrors.language}
      />
      <Select
        label="Categorie"
        value={values.category}
        onChange={(value) => setField('category', value as VacancyCategory)}
        options={categoryOptions}
        placeholder="Kies een categorie"
        error={fieldErrors.category}
      />
      <div className={styles.grid}>
        <Select
          label="Land"
          value={values.country}
          onChange={(value) => setField('country', value)}
          options={countrySelectOptions.map((item) =>
            'code' in item ? { value: item.code, label: item.labelNl } : { type: 'separator' as const },
          )}
          placeholder="Kies een land"
          error={fieldErrors.country}
          suffix={values.country || undefined}
        />
        <TextField
          label="Stad"
          value={values.city}
          onChange={(value) => setField('city', value)}
          error={fieldErrors.city}
          maxLength={200}
        />
      </div>
      <SegmentedControl
        label="Type werkplek"
        value={values.workplaceType}
        onChange={(value) => setField('workplaceType', value)}
        options={workplaceTypeOptions}
      />
      <div className={styles.grid}>
        <NumberField
          label="Uren per week (minimum)"
          value={values.minHoursPerWeek}
          onChange={(value) => setField('minHoursPerWeek', value)}
          error={fieldErrors.minHoursPerWeek}
          min={0}
          max={60}
        />
        <NumberField
          label="Uren per week (maximum)"
          value={values.maxHoursPerWeek}
          onChange={(value) => setField('maxHoursPerWeek', value)}
          error={fieldErrors.maxHoursPerWeek}
          min={1}
          max={60}
        />
      </div>

      <div className={styles.footer}>
        <Button
          variant="text"
          type="button"
          className={styles.saveDraftButton}
          disabled={saving}
          onClick={() => save(false)}
        >
          Bewaren als concept
        </Button>
        <Button variant="primary" type="button" disabled={saving} onClick={() => save(true)}>
          Volgende
        </Button>
      </div>
    </Card>
  );
}
