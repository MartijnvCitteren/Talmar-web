import { useState } from 'react';
import { Sparkles, CircleCheck, Square } from 'lucide-react';
import {
  currencyOptions,
  holidayPeriodOptions,
  salaryPeriodOptions,
  toAnnualHolidayDays,
  vacancyApi,
  type ContactPerson,
  type CurrencyCode,
  type HolidayPeriod,
  type Offer,
  type SalaryPeriod,
  type VacancyResponse,
} from '../../../entities/vacancy';
import type { ApiError } from '../../../shared/api';
import { toFieldErrors, toUserMessage } from '../../../shared/lib/problem-details';
import { Button, Card, Checkbox, ErrorBanner, NumberField, Select, TextField } from '../../../shared/ui';
import styles from './VacancyContactOfferForm.module.css';

/**
 * Deliberately not imported from `features/generate-vacancy-description` — features
 * don't import each other's internals (§10.3). The page threads the same phase value
 * from its single `useGenerateVacancyDescription()` instance via this prop.
 */
export type VacancyContactOfferGenerationPhase = 'idle' | 'generating' | 'ready' | 'failed';

export interface HolidayInput {
  amount: number;
  period: HolidayPeriod;
}

export interface VacancyContactOfferFormProps {
  vacancyId: string;
  onSaved: (vacancy: VacancyResponse) => void;
  mode?: 'manual' | 'ai';
  phase?: VacancyContactOfferGenerationPhase;
  initialValues?: {
    contactPerson?: ContactPerson;
    offer?: Offer;
  };
  /**
   * The vakantiedagen amount/period the user actually entered earlier this session
   * (ADR-0005, page-local `holidayInput` state), preferred over reconstructing from the
   * converted annual `offer.numberOfHolidays` figure when redisplaying this form (e.g.
   * navigating back to step 3 from Overzicht's "Aanpassen").
   */
  initialHolidayInput?: HolidayInput;
  /** Surfaces the raw entered vakantiedagen amount + period (ADR-0005) for §11.3's page-local `holidayInput` state. */
  onHolidayInputChange?: (input: HolidayInput | undefined) => void;
}

interface FormValues {
  name: string;
  role: string;
  phone: string;
  email: string;
  salaryMin: number | '';
  salaryMax: number | '';
  currency: CurrencyCode | '';
  salaryPeriod: SalaryPeriod | '';
  numberOfHolidays: number | '';
}

function toFormValues(
  initialValues: VacancyContactOfferFormProps['initialValues'],
  initialHolidayInput: HolidayInput | undefined,
): FormValues {
  const { contactPerson, offer } = initialValues ?? {};
  return {
    name: contactPerson?.name ?? '',
    role: contactPerson?.role ?? '',
    phone: contactPerson?.phone ?? '',
    email: contactPerson?.email ?? '',
    salaryMin: offer?.salaryMin ?? '',
    salaryMax: offer?.salaryMax ?? '',
    currency: offer?.currency ?? '',
    salaryPeriod: offer?.salaryPeriod ?? '',
    numberOfHolidays: initialHolidayInput?.amount ?? offer?.numberOfHolidays ?? '',
  };
}

/** The same rules as `ContactPerson` in the API contract, so the API never has to reject them. */
const NAME_PATTERN = /^(?=.*\p{L})[\p{L}\p{M}'’.-]+( [\p{L}\p{M}'’.-]+)*$/u;
const ROLE_PATTERN = /^[\p{L}\p{M}\p{N} &/(),.'’+-]+$/u;
const PHONE_PATTERN = /^\+?(?:[ ()./-]*[0-9]){6,15}[ ()./-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SALARY = 100_000_000;
const MAX_HOLIDAYS = 60;

const messages = {
  name: 'Vul een naam in van 2 tot 35 letters. Alleen letters, spaties, punten, apostroffen en streepjes.',
  role: 'Gebruik maximaal 50 tekens: letters, cijfers, spaties en & / ( ) , . \' + -',
  phone: 'Vul een telefoonnummer in van 6 tot 15 cijfers, eventueel met + aan het begin.',
  email: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.',
  salaryMin: 'Vul een salaris in vanaf 0.',
  salaryMax: 'Vul een salaris in vanaf 0.',
  currency: 'Kies een valuta bij het salaris.',
  salaryPeriod: 'Kies een salarisperiode bij het salaris.',
  numberOfHolidays: `Vul een aantal vakantiedagen in van 0 tot ${MAX_HOLIDAYS} per jaar.`,
  offer: 'Vul een salaris of het aantal vakantiedagen in.',
};

function validate(values: FormValues, hideSalary: boolean, holidayPeriod: HolidayPeriod): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = values.name.trim();
  if (name.length < 2 || name.length > 35 || !NAME_PATTERN.test(name)) {
    errors.name = messages.name;
  }
  const role = values.role.trim();
  if (role && (role.length > 50 || !ROLE_PATTERN.test(role))) {
    errors.role = messages.role;
  }
  const phone = values.phone.trim();
  if (phone && (phone.length > 25 || !PHONE_PATTERN.test(phone))) {
    errors.phone = messages.phone;
  }
  const email = values.email.trim();
  if (!email || email.length > 75 || !EMAIL_PATTERN.test(email)) {
    errors.email = messages.email;
  }

  const hasSalary = !hideSalary && (values.salaryMin !== '' || values.salaryMax !== '');
  if (hasSalary) {
    if (values.salaryMin !== '' && (values.salaryMin < 0 || values.salaryMin > MAX_SALARY)) {
      errors.salaryMin = messages.salaryMin;
    }
    if (values.salaryMax !== '' && (values.salaryMax < 0 || values.salaryMax > MAX_SALARY)) {
      errors.salaryMax = messages.salaryMax;
    }
    if (values.salaryMin !== '' && values.salaryMax !== '' && values.salaryMin > values.salaryMax) {
      errors.salaryMax = 'Het maximum moet minstens zo hoog zijn als het minimum.';
    }
    if (!values.currency) {
      errors.currency = messages.currency;
    }
    if (!values.salaryPeriod) {
      errors.salaryPeriod = messages.salaryPeriod;
    }
  }

  if (values.numberOfHolidays !== '') {
    const annual = toAnnualHolidayDays(values.numberOfHolidays, holidayPeriod);
    if (values.numberOfHolidays < 0 || annual > MAX_HOLIDAYS) {
      errors.numberOfHolidays = messages.numberOfHolidays;
    }
  }

  return errors;
}

/**
 * The offer as the API wants it, or `undefined` when there is nothing to send: the API rejects an
 * offer without a salary and without holidays, so a recruiter who shares neither sends no offer.
 */
function toOffer(values: FormValues, hideSalary: boolean, holidayPeriod: HolidayPeriod): Offer | undefined {
  const offer: Offer = {};
  if (!hideSalary && values.salaryMin !== '') offer.salaryMin = values.salaryMin;
  if (!hideSalary && values.salaryMax !== '') offer.salaryMax = values.salaryMax;
  if (offer.salaryMin != null || offer.salaryMax != null) {
    offer.currency = values.currency || undefined;
    offer.salaryPeriod = values.salaryPeriod || undefined;
  }
  if (values.numberOfHolidays !== '') {
    offer.numberOfHolidays = toAnnualHolidayDays(values.numberOfHolidays, holidayPeriod);
  }
  return Object.keys(offer).length > 0 ? offer : undefined;
}

function GenerationBanner({ phase }: { phase: VacancyContactOfferGenerationPhase }) {
  if (phase === 'failed') {
    return (
      <div className={styles.bannerFailed} role="status">
        <Square size={14} aria-hidden="true" />
        Je vacaturetekst kon niet worden opgesteld. Ga gerust verder — in het overzicht lees je waarom en kun je de tekst zelf schrijven.
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className={styles.bannerReady}>
        <CircleCheck size={18} aria-hidden="true" />
        Je concepttekst staat klaar — je ziet hem in het overzicht bij de volgende stap.
      </div>
    );
  }

  return (
    <div className={styles.bannerGenerating}>
      <Sparkles size={18} aria-hidden="true" />
      We stellen je vacaturetekst op — ga jij alvast verder met contact en voorwaarden.
    </div>
  );
}

export function VacancyContactOfferForm({
  vacancyId,
  onSaved,
  mode = 'manual',
  phase = 'generating',
  initialValues,
  initialHolidayInput,
  onHolidayInputChange,
}: VacancyContactOfferFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(initialValues, initialHolidayInput));
  const [holidayPeriod, setHolidayPeriod] = useState<HolidayPeriod>(initialHolidayInput?.period ?? 'ANNUAL');
  const [hideSalary, setHideSalary] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [topLevelError, setTopLevelError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const errors = validate(values, hideSalary, holidayPeriod);
    setFieldErrors(errors);
    setTopLevelError(undefined);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const contactPerson: ContactPerson = {
        name: values.name.trim(),
        role: values.role.trim() || undefined,
        phone: values.phone.trim() || undefined,
        email: values.email.trim(),
      };
      const offer = toOffer(values, hideSalary, holidayPeriod);
      const response = await vacancyApi.patchVacancyContactOffer(vacancyId, {
        contactPerson,
        ...(offer ? { offer } : {}),
      });
      // Defensive: `VacancyResponse` does not require contactPerson/offer, so a response without
      // them is contract-legal; fall back to what was just sent rather than dropping it.
      onSaved({
        ...response,
        contactPerson: response.contactPerson ?? contactPerson,
        offer: response.offer ?? offer,
      });
      onHolidayInputChange?.(
        values.numberOfHolidays === '' ? undefined : { amount: values.numberOfHolidays, period: holidayPeriod },
      );
    } catch (caught) {
      const apiError = caught as ApiError;
      if (apiError.status === 400 && apiError.errors?.length) {
        const apiFieldErrors = toFieldErrors(apiError.errors, messages);
        setFieldErrors(apiFieldErrors);
        if (apiFieldErrors.offer) {
          setTopLevelError(apiFieldErrors.offer);
        }
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
    <>
      {mode === 'ai' && <GenerationBanner phase={phase} />}
      <Card>
        <h2>Contact en voorwaarden</h2>
        <ErrorBanner message={topLevelError} />
        <div className={styles.contactGrid}>
          <TextField label="Naam" value={values.name} onChange={(v) => setField('name', v)} error={fieldErrors.name} maxLength={35} />
          <TextField label="Rol" value={values.role} onChange={(v) => setField('role', v)} error={fieldErrors.role} maxLength={50} />
        </div>
        <div className={styles.contactGrid}>
          <TextField label="Telefoon" value={values.phone} onChange={(v) => setField('phone', v)} error={fieldErrors.phone} maxLength={25} />
          <TextField label="E-mailadres" value={values.email} onChange={(v) => setField('email', v)} error={fieldErrors.email} maxLength={75} />
        </div>

        <div className={styles.salaryHeader}>
          <h3>Salaris en voorwaarden</h3>
          <Checkbox label="Liever niet delen" checked={hideSalary} onChange={setHideSalary} />
        </div>

        {!hideSalary && (
          <div className={styles.contactGrid}>
            <NumberField label="Salaris minimum" value={values.salaryMin} onChange={(v) => setField('salaryMin', v)} error={fieldErrors.salaryMin} min={0} />
            <NumberField label="Salaris maximum" value={values.salaryMax} onChange={(v) => setField('salaryMax', v)} error={fieldErrors.salaryMax} min={0} />
          </div>
        )}
        {!hideSalary && (
          <div className={styles.contactGrid}>
            <Select
              label="Valuta"
              value={values.currency}
              onChange={(v) => setField('currency', v as CurrencyCode)}
              options={currencyOptions}
              placeholder="Kies een valuta"
              error={fieldErrors.currency}
            />
            <Select
              label="Salarisperiode"
              value={values.salaryPeriod}
              onChange={(v) => setField('salaryPeriod', v as SalaryPeriod)}
              options={salaryPeriodOptions}
              placeholder="Kies een periode"
              error={fieldErrors.salaryPeriod}
            />
          </div>
        )}
        <div className={styles.contactGrid}>
          <NumberField
            label="Aantal vakantiedagen"
            value={values.numberOfHolidays}
            onChange={(v) => setField('numberOfHolidays', v)}
            error={fieldErrors.numberOfHolidays}
            min={0}
          />
          <Select
            label="Periode vakantiedagen"
            value={holidayPeriod}
            onChange={(v) => setHolidayPeriod(v as HolidayPeriod)}
            options={holidayPeriodOptions}
          />
        </div>

        <Button type="button" disabled={saving} onClick={save}>
          Volgende
        </Button>
      </Card>
    </>
  );
}
