import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { descriptionApi } from '../../../entities/vacancy-description';
import { ReviewVacancy } from './ReviewVacancy';
import type { VacancyResponse } from '../../../entities/vacancy';

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

const vacancy: VacancyResponse = {
  id: 'vacancy-1',
  status: 'DRAFT',
  jobTitle: 'Senior Backend Developer',
  language: 'EN',
  category: 'ENGINEERING',
  location: { country: 'NL', city: 'Amsterdam' },
  workplaceType: 'HYBRID',
  minHoursPerWeek: 24,
  maxHoursPerWeek: 36,
  createdAt: '2026-09-19T00:00:00Z',
  contactPerson: { name: 'Jane Doe', role: 'HR', phone: '0612345678', email: 'jane@example.com' },
  offer: { salaryMin: 3000, salaryMax: 4000, currency: 'EUR', salaryPeriod: 'MONTHLY', numberOfHolidays: 20 },
} as unknown as VacancyResponse;

const description = { summary: 'A great job summary', jobDescription: 'Role text', tasks: 'Task list' };

describe('ReviewVacancy', () => {
  beforeEach(() => {
    vi.mocked(descriptionApi.saveDescription).mockReset();
  });

  it('shows skeleton bars while phase is generating and no description yet', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        mode="ai"
        phase="generating"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('presentation')).toHaveLength(4);
    expect(screen.queryByLabelText('Samenvatting')).not.toBeInTheDocument();
  });

  it('renders sections as read-only text by default', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText('A great job summary')).toBeInTheDocument();
    expect(screen.queryByLabelText('Samenvatting')).not.toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText('€3.000 – €4.000 per maand')).toBeInTheDocument();
  });

  it('shows a placeholder for a read-only section with no content instead of an empty paragraph', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={{ ...description, tasks: '' }}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText('Nog niet ingevuld')).toBeInTheDocument();
  });

  it('includes weekly hours in the meta line', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText(/24–36 uur per week/)).toBeInTheDocument();
    expect(screen.getByText(/· Engels/)).toBeInTheDocument();
  });

  it('does not show "Opnieuw" regenerate controls in manual mode', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Opnieuw/ })).not.toBeInTheDocument();
  });

  it('shows "Opnieuw" regenerate controls in AI mode and calls onRegenerate with the section', async () => {
    const user = userEvent.setup();
    const onRegenerate = vi.fn();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="ai"
        phase="ready"
        onDescriptionSaved={vi.fn()}
        onRegenerate={onRegenerate}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: /Opnieuw/ });
    expect(buttons).toHaveLength(3);
    await user.click(buttons[0]);

    expect(onRegenerate).toHaveBeenCalledWith('summary');
  });

  it('"Aanpassen basisgegevens" and "Aanpassen contact en voorwaarden" call onNavigateToStep with step 1 and step 3', async () => {
    const user = userEvent.setup();
    const onNavigateToStep = vi.fn();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={onNavigateToStep}
        onViewPreview={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Aanpassen basisgegevens' }));
    expect(onNavigateToStep).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: 'Aanpassen contact en voorwaarden' }));
    expect(onNavigateToStep).toHaveBeenCalledWith(3);
  });

  it('renders each section label as an h3 sub-heading, not plain text', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Samenvatting' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Over de rol' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Taken' })).toBeInTheDocument();
  });

  it('"Aanpassen Samenvatting" swaps only that section into an editable field, prefilled with the current value', async () => {
    const user = userEvent.setup();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Aanpassen Samenvatting' }));

    expect(screen.getByLabelText('Samenvatting')).toHaveValue('A great job summary');
    // The other two sections stay read-only.
    expect(screen.queryByLabelText('Over de rol')).not.toBeInTheDocument();
    expect(screen.getByText('Role text')).toBeInTheDocument();
  });

  it('"Opslaan" saves the full current values with the edited section applied, then returns to read-only', async () => {
    const user = userEvent.setup();
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue({ ...description, summary: 'Updated summary' });
    const onDescriptionSaved = vi.fn();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={onDescriptionSaved}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Aanpassen Samenvatting' }));
    await user.clear(screen.getByLabelText('Samenvatting'));
    await user.type(screen.getByLabelText('Samenvatting'), 'Updated summary');
    await user.click(screen.getByRole('button', { name: 'Opslaan' }));

    await waitFor(() =>
      expect(descriptionApi.saveDescription).toHaveBeenCalledWith(
        'vacancy-1',
        expect.objectContaining({
          summary: 'Updated summary',
          jobDescription: 'Role text',
          tasks: 'Task list',
        }),
      ),
    );
    expect(onDescriptionSaved).toHaveBeenCalledWith({ ...description, summary: 'Updated summary' });
    expect(await screen.findByText('Updated summary')).toBeInTheDocument();
    expect(screen.queryByLabelText('Samenvatting')).not.toBeInTheDocument();
  });

  it('"Annuleren" reverts the section without calling saveDescription', async () => {
    const user = userEvent.setup();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Aanpassen Samenvatting' }));
    await user.type(screen.getByLabelText('Samenvatting'), ' extra text');
    await user.click(screen.getByRole('button', { name: 'Annuleren' }));

    expect(descriptionApi.saveDescription).not.toHaveBeenCalled();
    expect(screen.getByText('A great job summary')).toBeInTheDocument();
    expect(screen.queryByLabelText('Samenvatting')).not.toBeInTheDocument();
  });

  it('disables "Bekijk je vacature" while a section is mid-edit', async () => {
    const user = userEvent.setup();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Bekijk je vacature' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Aanpassen Samenvatting' }));
    expect(screen.getByRole('button', { name: 'Bekijk je vacature' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Annuleren' }));
    expect(screen.getByRole('button', { name: 'Bekijk je vacature' })).toBeEnabled();
  });

  it('renders "Bekijk je vacature" inside the Card', () => {
    const { container } = render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    const card = container.querySelector('[class*="card"]');
    const button = screen.getByRole('button', { name: 'Bekijk je vacature' });
    expect(card).toContainElement(button);
  });

  it('saves the current values via saveDescription when "Bekijk je vacature" is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue(description);
    const onViewPreview = vi.fn();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={onViewPreview}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Bekijk je vacature' }));

    await waitFor(() => expect(descriptionApi.saveDescription).toHaveBeenCalledWith('vacancy-1', description));
    await waitFor(() => expect(onViewPreview).toHaveBeenCalledTimes(1));
  });

  it('formats the salary line with nl-NL thousands separators and the period', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText('€3.000 – €4.000 per maand')).toBeInTheDocument();
  });

  it('shows "Salaris in overleg" when the vacancy has no offer', () => {
    const vacancyWithoutOffer = { ...vacancy, offer: undefined };
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancyWithoutOffer}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText('Salaris in overleg')).toBeInTheDocument();
  });

  it('shows the contact phone number alongside name/role/email (regression: phone was missing entirely)', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText(/0612345678/)).toBeInTheDocument();
  });

  it('groups the contact, salary and holiday lines into one block instead of three Card-level siblings', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    const contactLine = screen.getByText(/Jane Doe/);
    const salaryLine = screen.getByText('€3.000 – €4.000 per maand');
    const holidaysLine = screen.getByText('20 vakantiedagen per jaar');

    expect(contactLine.parentElement).toBe(salaryLine.parentElement);
    expect(contactLine.parentElement).toBe(holidaysLine.parentElement);
    // A dedicated wrapper (not the Card itself, which uses a 24px gap for all its
    // direct children) groups these three lines at a tighter 8px gap.
    expect(contactLine.parentElement?.className).toMatch(/contactDetails/);
  });

  it('shows a holiday-days line reconstructed from the annual offer figure when no holidayInput is given', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText('20 vakantiedagen per jaar')).toBeInTheDocument();
  });

  it('prefers the page-supplied holidayInput over the reconstructed annual figure', () => {
    const vacancyWithConvertedHolidays = {
      ...vacancy,
      offer: { ...vacancy.offer, numberOfHolidays: 260 },
    } as unknown as VacancyResponse;
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancyWithConvertedHolidays}
        description={description}
        mode="manual"
        holidayInput={{ amount: 5, period: 'WEEKLY' }}
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText('5 vakantiedagen per week')).toBeInTheDocument();
    expect(screen.queryByText('260 vakantiedagen per jaar')).not.toBeInTheDocument();
  });
});
