import { useEffect, useState } from 'react';
import { descriptionApi, type VacancyDescriptionResponse } from '../../../entities/vacancy-description';
import type { ApiError } from '../../../shared/api';
import { toUserMessage } from '../../../shared/lib/problem-details';
import { Button, Card, CardHeader, ErrorBanner, TextField } from '../../../shared/ui';

export interface VacancyDescriptionEditorProps {
  vacancyId: string;
  draft?: VacancyDescriptionResponse;
  onSaved: (description: VacancyDescriptionResponse) => void;
}

const emptyValues: Required<VacancyDescriptionResponse> = {
  summary: '',
  jobDescription: '',
  tasks: '',
  whatWeOffer: '',
  aboutUs: '',
};

const fieldMaxLengths: Record<keyof VacancyDescriptionResponse, number> = {
  summary: 1000,
  jobDescription: 5000,
  tasks: 5000,
  whatWeOffer: 2500,
  aboutUs: 2500,
};

export function VacancyDescriptionEditor({ vacancyId, draft, onSaved }: VacancyDescriptionEditorProps) {
  const [values, setValues] = useState<Required<VacancyDescriptionResponse>>({ ...emptyValues, ...draft });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (draft) {
      setValues((prev) => ({ ...prev, ...draft }));
    }
  }, [draft]);

  function setField(key: keyof VacancyDescriptionResponse, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setError(undefined);
    setSaving(true);
    try {
      const result = await descriptionApi.saveDescription(vacancyId, values);
      onSaved(result);
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

  return (
    <Card>
      <CardHeader title="Vacaturetekst" />
      <ErrorBanner message={error} />
      <TextField
        label="Samenvatting"
        value={values.summary}
        onChange={(value) => setField('summary', value)}
        maxLength={fieldMaxLengths.summary}
        multiline
      />
      <TextField
        label="Over de rol"
        value={values.jobDescription}
        onChange={(value) => setField('jobDescription', value)}
        maxLength={fieldMaxLengths.jobDescription}
        multiline
      />
      <TextField
        label="Taken"
        value={values.tasks}
        onChange={(value) => setField('tasks', value)}
        maxLength={fieldMaxLengths.tasks}
        helperText="Eén taak per regel"
        multiline
      />
      <TextField
        label="Team en organisatie"
        value={values.aboutUs}
        onChange={(value) => setField('aboutUs', value)}
        maxLength={fieldMaxLengths.aboutUs}
        multiline
      />
      <Button type="button" disabled={saving} onClick={save}>
        Volgende
      </Button>
    </Card>
  );
}
