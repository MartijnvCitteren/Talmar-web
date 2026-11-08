import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vacancyApi } from '../../../entities/vacancy';
import { descriptionApi } from '../../../entities/vacancy-description';
import { VacancyCreatePage } from './VacancyCreatePage';
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
      publishVacancy: vi.fn(),
    },
  };
});

vi.mock('../../../entities/vacancy-description', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/vacancy-description')>(
    '../../../entities/vacancy-description',
  );
  return {
    ...actual,
    descriptionApi: {
      generateDescription: vi.fn(),
      getGenerationStatus: vi.fn(),
      saveDescription: vi.fn(),
    },
  };
});

const createdVacancy: VacancyResponse = {
  id: 'vacancy-1',
  status: 'DRAFT',
  jobTitle: 'Senior Backend Developer',
  category: 'ENGINEERING',
  location: { country: 'NL', city: 'Amsterdam' },
  workplaceType: 'HYBRID',
  minHoursPerWeek: 24,
  maxHoursPerWeek: 36,
  createdAt: '2026-09-19T00:00:00Z',
} as unknown as VacancyResponse;

function renderPage() {
  render(
    <MemoryRouter>
      <VacancyCreatePage />
    </MemoryRouter>,
  );
}

async function fillStep1Fields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Functietitel'), 'Senior Backend Developer');
  await user.selectOptions(screen.getByLabelText('Categorie'), 'ENGINEERING');
  await user.selectOptions(screen.getByLabelText('Land'), 'NL');
  await user.type(screen.getByLabelText('Stad'), 'Amsterdam');
  await user.click(screen.getByRole('button', { name: 'Hybride' }));
  await user.clear(screen.getByLabelText('Uren per week (minimum)'));
  await user.type(screen.getByLabelText('Uren per week (minimum)'), '24');
  await user.clear(screen.getByLabelText('Uren per week (maximum)'));
  await user.type(screen.getByLabelText('Uren per week (maximum)'), '36');
}

async function completeStep1(user: ReturnType<typeof userEvent.setup>) {
  await fillStep1Fields(user);
  await user.click(screen.getByRole('button', { name: 'Volgende' }));
  await waitFor(() => expect(vacancyApi.createVacancy).toHaveBeenCalledTimes(1));
}

describe('VacancyCreatePage', () => {
  beforeEach(() => {
    vi.mocked(vacancyApi.createVacancy).mockReset();
    vi.mocked(vacancyApi.patchVacancyCore).mockReset();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockReset();
    vi.mocked(vacancyApi.publishVacancy).mockReset();
    vi.mocked(descriptionApi.saveDescription).mockReset();
    vi.mocked(descriptionApi.generateDescription).mockReset();
    vi.mocked(descriptionApi.getGenerationStatus).mockReset();
  });

  it('starts on step 1 and does not advance while the step is invalid', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('heading', { name: 'Basisgegevens' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(vacancyApi.createVacancy).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Basisgegevens' })).toBeInTheDocument();
  });

  it('locks step 2-4 in the Stepper before step 1 is completed via "Volgende"', () => {
    renderPage();

    expect(screen.getByRole('button', { name: /Vacaturetekst/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Contact en voorwaarden/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Overzicht/ })).toBeDisabled();
  });

  it('does not unlock step 2 in the Stepper when saving step 1 via "Bewaren als concept" instead of "Volgende"', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    renderPage();

    await fillStep1Fields(user);
    await user.click(screen.getByRole('button', { name: 'Bewaren als concept' }));
    await waitFor(() => expect(vacancyApi.createVacancy).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('button', { name: /Vacaturetekst/ })).toBeDisabled();
  });

  it('does not unlock step 3 in the Stepper from picking a mode alone, only after "Volgende" on the write view', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    renderPage();

    await completeStep1(user);
    expect(await screen.findByRole('heading', { name: 'Vacaturetekst' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Zelf schrijven/ }));
    expect(screen.getByRole('button', { name: /Contact en voorwaarden/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    expect(await screen.findByLabelText('Samenvatting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contact en voorwaarden/ })).toBeDisabled();
  });

  it('keeps previously reached steps clickable in the Stepper after navigating back', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue({ summary: 'Written by hand' });
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue({
      ...createdVacancy,
      contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
    } as unknown as VacancyResponse);
    renderPage();

    await completeStep1(user);
    await user.click(screen.getByRole('button', { name: /Zelf schrijven/ }));
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await user.type(screen.getByLabelText('Samenvatting'), 'Written by hand');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(descriptionApi.saveDescription).toHaveBeenCalledTimes(1));
    await user.type(screen.getByLabelText('Naam'), 'Jane Doe');
    await user.type(screen.getByLabelText('E-mailadres'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('heading', { name: 'Overzicht' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Basisgegevens' }));
    expect(await screen.findByRole('heading', { name: 'Basisgegevens' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Vacaturetekst/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Contact en voorwaarden/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Overzicht/ })).toBeEnabled();
  });

  it('shows a visible error (not a blank screen) when the backend is unreachable on step 1', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockRejectedValue({
      title: 'Netwerkfout: de server is niet bereikbaar.',
      status: 0,
    });
    renderPage();

    await completeStep1(user).catch(() => undefined);

    expect(await screen.findByRole('alert')).toHaveTextContent(/server nu niet bereiken/);
  });

  it('full click-through in manual mode: step 1 -> mode choice -> step 2 write -> step 3 -> step 4 -> preview -> publish -> published', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue({ summary: 'Written by hand' });
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue({
      ...createdVacancy,
      contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
    } as unknown as VacancyResponse);
    vi.mocked(vacancyApi.publishVacancy).mockResolvedValue({
      ...createdVacancy,
      status: 'PUBLISHED',
    } as unknown as VacancyResponse);

    renderPage();

    await completeStep1(user);
    expect(await screen.findByText(/Concept opgeslagen/)).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Vacaturetekst' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Zelf schrijven/ }));
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    // Step 2, write view: still on step 2 (Vacaturetekst), contact fields not present yet.
    expect(await screen.findByLabelText('Samenvatting')).toBeInTheDocument();
    expect(screen.queryByLabelText('Naam')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Samenvatting'), 'Written by hand');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(descriptionApi.saveDescription).toHaveBeenCalledTimes(1));

    // Step 3: contact/offer only, description fields no longer present.
    expect(await screen.findByLabelText('Naam')).toBeInTheDocument();
    expect(screen.queryByLabelText('Samenvatting')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Naam'), 'Jane Doe');
    await user.type(screen.getByLabelText('E-mailadres'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledTimes(1));

    expect(await screen.findByRole('heading', { name: 'Overzicht' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bekijk je vacature' }));

    expect(await screen.findByText('Zo ziet een sollicitant je vacature')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Publiceer vacature' }));

    expect(await screen.findByRole('dialog', { name: 'Vacature publiceren?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ja, publiceer' }));

    await waitFor(() => expect(vacancyApi.publishVacancy).toHaveBeenCalledWith('vacancy-1'));
    expect(await screen.findByText(/Vacature gepubliceerd/)).toBeInTheDocument();
  });

  it('returning to step 2 via the Stepper after a manual draft exists lands on the write view, not the mode choice', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue({ summary: 'Written by hand' });
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue({
      ...createdVacancy,
      contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
    } as unknown as VacancyResponse);

    renderPage();

    await completeStep1(user);
    expect(await screen.findByRole('heading', { name: 'Vacaturetekst' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Zelf schrijven/ }));
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByLabelText('Samenvatting')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Samenvatting'), 'Written by hand');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(descriptionApi.saveDescription).toHaveBeenCalledTimes(1));

    expect(await screen.findByLabelText('Naam')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Vacaturetekst/ }));

    expect(await screen.findByLabelText('Samenvatting')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Zelf schrijven/ })).not.toBeInTheDocument();
  });

  it('"Terug naar tekstkeuze" on the write view resets step2View so mode can be switched', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);

    renderPage();

    await completeStep1(user);
    expect(await screen.findByRole('heading', { name: 'Vacaturetekst' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Zelf schrijven/ }));
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByLabelText('Samenvatting')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Terug naar tekstkeuze' }));

    expect(await screen.findByRole('button', { name: /Talmar stelt een concept op/ })).toBeInTheDocument();
  });

  it('threads the entered vakantiedagen amount/period through to Overzicht instead of the converted annual figure', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue({ summary: 'Written by hand' });
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue({
      ...createdVacancy,
      contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
      offer: { numberOfHolidays: 24 },
    } as unknown as VacancyResponse);

    renderPage();

    await completeStep1(user);
    expect(await screen.findByRole('heading', { name: 'Vacaturetekst' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Zelf schrijven/ }));
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByLabelText('Samenvatting')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Samenvatting'), 'Written by hand');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(descriptionApi.saveDescription).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText('Naam'), 'Jane Doe');
    await user.type(screen.getByLabelText('E-mailadres'), 'jane@example.com');
    await user.type(screen.getByLabelText('Aantal vakantiedagen'), '2');
    await user.selectOptions(screen.getByLabelText('Periode vakantiedagen'), 'MONTHLY');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledTimes(1));

    expect(await screen.findByRole('heading', { name: 'Overzicht' })).toBeInTheDocument();
    expect(screen.getByText('2 vakantiedagen per maand')).toBeInTheDocument();
    expect(screen.queryByText('24 vakantiedagen per jaar')).not.toBeInTheDocument();
  });

  it('redisplays the entered vakantiedagen amount/period (not the converted annual figure) when returning to step 3 from Overzicht', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue({ summary: 'Written by hand' });
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue({
      ...createdVacancy,
      contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
      offer: { numberOfHolidays: 24 },
    } as unknown as VacancyResponse);

    renderPage();

    await completeStep1(user);
    expect(await screen.findByRole('heading', { name: 'Vacaturetekst' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Zelf schrijven/ }));
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByLabelText('Samenvatting')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Samenvatting'), 'Written by hand');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(descriptionApi.saveDescription).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText('Naam'), 'Jane Doe');
    await user.type(screen.getByLabelText('E-mailadres'), 'jane@example.com');
    await user.type(screen.getByLabelText('Aantal vakantiedagen'), '2');
    await user.selectOptions(screen.getByLabelText('Periode vakantiedagen'), 'MONTHLY');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledTimes(1));

    expect(await screen.findByRole('heading', { name: 'Overzicht' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Aanpassen contact en voorwaarden' }));

    expect(await screen.findByLabelText('Aantal vakantiedagen')).toHaveValue(2);
    expect(screen.getByLabelText('Periode vakantiedagen')).toHaveValue('MONTHLY');
  });

  it('full click-through in AI mode: mode choice opens the 3-questions modal and gates step 3/4 on the shared generation phase', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    vi.mocked(descriptionApi.generateDescription).mockResolvedValue({
      generationId: 'gen-1',
      status: 'PENDING',
    });
    vi.mocked(descriptionApi.getGenerationStatus).mockResolvedValue({
      generationId: 'gen-1',
      status: 'COMPLETED',
      description: { summary: 'AI summary', jobDescription: 'AI role text', tasks: 'AI tasks' },
    });
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue({
      ...createdVacancy,
      contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
    } as unknown as VacancyResponse);

    renderPage();
    await completeStep1(user);

    expect(await screen.findByRole('heading', { name: 'Vacaturetekst' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Talmar stelt een concept op/ }));
    await user.click(screen.getByRole('button', { name: 'Beantwoord 3 vragen' }));

    expect(await screen.findByRole('dialog', { name: 'Drie korte vragen' })).toBeInTheDocument();
    await user.type(
      screen.getByLabelText('Wat doet deze collega op een gemiddelde dag?'),
      'API bouwen',
    );
    await user.type(screen.getByLabelText('Waarom zou iemand voor jullie kiezen?'), 'Autonomie');
    await user.click(screen.getByRole('button', { name: 'Genereer mijn concept vacature' }));

    await waitFor(() => expect(descriptionApi.generateDescription).toHaveBeenCalledTimes(1));

    expect(await screen.findByLabelText('Naam')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Naam'), 'Jane Doe');
    await user.type(screen.getByLabelText('E-mailadres'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledTimes(1));

    expect(await screen.findByRole('heading', { name: 'Overzicht' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('AI summary')).toBeInTheDocument());
  });
});
