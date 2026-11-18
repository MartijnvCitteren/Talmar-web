import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vacancyApi } from '../../../entities/vacancy';
import { VacancyContactOfferForm } from './VacancyContactOfferForm';
import type { VacancyResponse } from '../../../entities/vacancy';

vi.mock('../../../entities/vacancy', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/vacancy')>(
    '../../../entities/vacancy',
  );
  return {
    ...actual,
    vacancyApi: {
      createVacancy: vi.fn(),
      patchVacancyCore: vi.fn(),
      patchVacancyContactOffer: vi.fn(),
    },
  };
});

const vacancy: VacancyResponse = { id: 'vacancy-1' } as unknown as VacancyResponse;

async function fillContactPerson(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Naam'), 'Jane Doe');
  await user.type(screen.getByLabelText('E-mailadres'), 'jane@example.com');
}

describe('VacancyContactOfferForm', () => {
  beforeEach(() => {
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockReset();
  });

  it('requires currency and salaryPeriod once a salary field is filled in', async () => {
    const user = userEvent.setup();
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Salaris minimum'), '3000');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByText('Kies een valuta bij het salaris.')).toBeInTheDocument();
    expect(screen.getByText('Kies een salarisperiode bij het salaris.')).toBeInTheDocument();
    expect(vacancyApi.patchVacancyContactOffer).not.toHaveBeenCalled();
  });

  it('sends only the contact person when neither a salary nor holidays are filled in, since the API rejects an empty offer', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledWith('vacancy-1', {
        contactPerson: { name: 'Jane Doe', email: 'jane@example.com', role: undefined, phone: undefined },
      }),
    );
  });

  it('rejects a salary minimum above the maximum without calling the API', async () => {
    const user = userEvent.setup();
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Salaris minimum'), '5000');
    await user.type(screen.getByLabelText('Salaris maximum'), '4000');
    await user.selectOptions(screen.getByLabelText('Valuta'), 'EUR');
    await user.selectOptions(screen.getByLabelText('Salarisperiode'), 'MONTHLY');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByText('Het maximum moet minstens zo hoog zijn als het minimum.')).toBeInTheDocument();
    expect(vacancyApi.patchVacancyContactOffer).not.toHaveBeenCalled();
  });

  it('applies the contract rules for name, phone and email before calling the API', async () => {
    const user = userEvent.setup();
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await user.type(screen.getByLabelText('Naam'), 'Jane 123');
    await user.type(screen.getByLabelText('Telefoon'), '12-34');
    await user.type(screen.getByLabelText('E-mailadres'), 'jane@');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByText(/Vul een naam in van 2 tot 35 letters/)).toBeInTheDocument();
    expect(screen.getByText(/Vul een telefoonnummer in van 6 tot 15 cijfers/)).toBeInTheDocument();
    expect(screen.getByText(/Vul een geldig e-mailadres in/)).toBeInTheDocument();
    expect(vacancyApi.patchVacancyContactOffer).not.toHaveBeenCalled();
  });

  it('accepts an international phone number with spaces and brackets', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Telefoon'), '+31 (0)6 12 34 56 78');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() => expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledTimes(1));
  });

  it('shows Dutch messages for field errors the API returns, keyed by the nested field path', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockRejectedValue({
      title: 'Validation failed',
      status: 400,
      errors: [{ field: 'contactPerson.email', message: 'must be a well-formed email address' }],
    });
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByText(/Vul een geldig e-mailadres in/)).toBeInTheDocument();
    expect(screen.queryByText(/well-formed/)).not.toBeInTheDocument();
  });

  it('offers every currency the API accepts', () => {
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    const values = Array.from(screen.getByLabelText('Valuta').querySelectorAll('option')).map((o) => o.getAttribute('value'));
    expect(values).toEqual(expect.arrayContaining(['EUR', 'NOK', 'ISK', 'UAH']));
  });

  it('calls patchVacancyContactOffer with contactPerson and offer on save', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    const onSaved = vi.fn();
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={onSaved} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Salaris minimum'), '3000');
    await user.selectOptions(screen.getByLabelText('Valuta'), 'EUR');
    await user.selectOptions(screen.getByLabelText('Salarisperiode'), 'MONTHLY');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledWith(
        'vacancy-1',
        expect.objectContaining({
          contactPerson: expect.objectContaining({ name: 'Jane Doe', email: 'jane@example.com' }),
          offer: expect.objectContaining({ salaryMin: 3000, currency: 'EUR', salaryPeriod: 'MONTHLY' }),
        }),
      ),
    );
    // §11.2: onSaved receives the submitted contactPerson/offer merged in, since the
    // mocked response here (like a contract-legal real one) omits them.
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'vacancy-1',
        contactPerson: expect.objectContaining({ name: 'Jane Doe', email: 'jane@example.com' }),
        offer: expect.objectContaining({ salaryMin: 3000, currency: 'EUR', salaryPeriod: 'MONTHLY' }),
      }),
    );
  });

  it('hides the salary grid and leaves the salary out on save when "Liever niet delen" is checked', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Salaris minimum'), '3000');
    await user.type(screen.getByLabelText('Aantal vakantiedagen'), '25');
    await user.click(screen.getByRole('checkbox', { name: 'Liever niet delen' }));

    expect(screen.queryByLabelText('Salaris minimum')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledWith(
        'vacancy-1',
        expect.objectContaining({ offer: { numberOfHolidays: 25 } }),
      ),
    );
  });

  it('converts the entered vakantiedagen amount to an annual figure for a non-ANNUAL period before saving', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Aantal vakantiedagen'), '2');
    await user.selectOptions(screen.getByLabelText('Periode vakantiedagen'), 'MONTHLY');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledWith(
        'vacancy-1',
        expect.objectContaining({
          offer: expect.objectContaining({ numberOfHolidays: 24 }),
        }),
      ),
    );
  });

  it('surfaces the raw entered holiday amount and period via onHolidayInputChange after a successful save', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    const onHolidayInputChange = vi.fn();
    render(
      <VacancyContactOfferForm
        vacancyId="vacancy-1"
        onSaved={vi.fn()}
        onHolidayInputChange={onHolidayInputChange}
      />,
    );

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Aantal vakantiedagen'), '2');
    await user.selectOptions(screen.getByLabelText('Periode vakantiedagen'), 'MONTHLY');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(onHolidayInputChange).toHaveBeenCalledWith({ amount: 2, period: 'MONTHLY' }),
    );
  });

  it('groups Valuta and Salarisperiode into their own row, separate from Salaris minimum/maximum', () => {
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    const valuta = screen.getByLabelText('Valuta');
    const salarisperiode = screen.getByLabelText('Salarisperiode');
    const salarisMin = screen.getByLabelText('Salaris minimum');

    const rowOf = (control: HTMLElement) => control.closest('div')?.parentElement?.parentElement;

    expect(rowOf(valuta)).toBe(rowOf(salarisperiode));
    expect(rowOf(valuta)).not.toBe(rowOf(salarisMin));
  });

  it('keeps "Aantal vakantiedagen" visible and interactive when "Liever niet delen" is checked (regression)', async () => {
    const user = userEvent.setup();
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    expect(screen.getByLabelText('Aantal vakantiedagen')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Liever niet delen' }));

    expect(screen.getByLabelText('Aantal vakantiedagen')).toBeInTheDocument();
    expect(screen.getByLabelText('Aantal vakantiedagen')).toBeEnabled();
  });

  it('renders a generating banner in AI mode driven by the phase prop, without polling itself', async () => {
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} mode="ai" phase="generating" />);

    expect(
      screen.getByText(
        'We stellen je vacaturetekst op — ga jij alvast verder met contact en voorwaarden.',
      ),
    ).toBeInTheDocument();
  });

  it('renders a calm failure banner in AI mode when the generation failed, instead of the generating one', () => {
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} mode="ai" phase="failed" />);

    expect(screen.getByRole('status')).toHaveTextContent(/kon niet worden opgesteld/);
    expect(screen.queryByText(/We stellen je vacaturetekst op/)).not.toBeInTheDocument();
  });

  it('renders a ready banner in AI mode when phase is ready', async () => {
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} mode="ai" phase="ready" />);

    expect(
      screen.getByText('Je concepttekst staat klaar — je ziet hem in het overzicht bij de volgende stap.'),
    ).toBeInTheDocument();
  });

  it('prefills fields from initialValues so navigating back does not lose saved data', async () => {
    render(
      <VacancyContactOfferForm
        vacancyId="vacancy-1"
        onSaved={vi.fn()}
        initialValues={{
          contactPerson: { name: 'Jane Doe', email: 'jane@example.com', role: 'Recruiter', phone: '0612345678' },
          offer: { salaryMin: 4000, salaryMax: 5000, currency: 'EUR', salaryPeriod: 'MONTHLY', numberOfHolidays: 25 },
        }}
      />,
    );

    expect(screen.getByLabelText('Naam')).toHaveValue('Jane Doe');
    expect(screen.getByLabelText('E-mailadres')).toHaveValue('jane@example.com');
    expect(screen.getByLabelText('Salaris minimum')).toHaveValue(4000);
    expect(screen.getByLabelText('Salaris maximum')).toHaveValue(5000);
    expect(screen.getByLabelText('Valuta')).toHaveValue('EUR');
    expect(screen.getByLabelText('Salarisperiode')).toHaveValue('MONTHLY');
  });

  it('prefills vakantiedagen from initialHolidayInput (amount + period) rather than the converted annual offer figure', () => {
    render(
      <VacancyContactOfferForm
        vacancyId="vacancy-1"
        onSaved={vi.fn()}
        initialValues={{
          contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
          offer: { numberOfHolidays: 260 },
        }}
        initialHolidayInput={{ amount: 5, period: 'WEEKLY' }}
      />,
    );

    expect(screen.getByLabelText('Aantal vakantiedagen')).toHaveValue(5);
    expect(screen.getByLabelText('Periode vakantiedagen')).toHaveValue('WEEKLY');
  });

  it('falls back to the raw annual offer figure (period ANNUAL) when no initialHolidayInput is given', () => {
    render(
      <VacancyContactOfferForm
        vacancyId="vacancy-1"
        onSaved={vi.fn()}
        initialValues={{
          contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
          offer: { numberOfHolidays: 20 },
        }}
      />,
    );

    expect(screen.getByLabelText('Aantal vakantiedagen')).toHaveValue(20);
    expect(screen.getByLabelText('Periode vakantiedagen')).toHaveValue('ANNUAL');
  });

  it('resaves the prefilled salary values unchanged when clicking Volgende again', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    render(
      <VacancyContactOfferForm
        vacancyId="vacancy-1"
        onSaved={vi.fn()}
        initialValues={{
          contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
          offer: { salaryMin: 4000, salaryMax: 5000, currency: 'EUR', salaryPeriod: 'MONTHLY' },
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledWith(
        'vacancy-1',
        expect.objectContaining({
          offer: expect.objectContaining({ salaryMin: 4000, salaryMax: 5000, currency: 'EUR', salaryPeriod: 'MONTHLY' }),
        }),
      ),
    );
  });

  it('preserves the just-submitted contactPerson/offer in onSaved when the PATCH response omits them (§11.2)', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue({
      id: 'vacancy-1',
      // contactPerson and offer omitted, as a contract-legal but data-losing response.
    } as unknown as VacancyResponse);
    const onSaved = vi.fn();
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={onSaved} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Salaris minimum'), '3000');
    await user.selectOptions(screen.getByLabelText('Valuta'), 'EUR');
    await user.selectOptions(screen.getByLabelText('Salarisperiode'), 'MONTHLY');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          contactPerson: expect.objectContaining({ name: 'Jane Doe', email: 'jane@example.com' }),
          offer: expect.objectContaining({ salaryMin: 3000, currency: 'EUR', salaryPeriod: 'MONTHLY' }),
        }),
      ),
    );
  });
});
