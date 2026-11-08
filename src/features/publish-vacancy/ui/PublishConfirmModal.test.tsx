import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vacancyApi } from '../../../entities/vacancy';
import { PublishConfirmModal } from './PublishConfirmModal';
import type { VacancyResponse } from '../../../entities/vacancy';

vi.mock('../../../entities/vacancy', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/vacancy')>('../../../entities/vacancy');
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

describe('PublishConfirmModal', () => {
  it('renders the vacancy title in the body copy', () => {
    render(
      <PublishConfirmModal
        open={true}
        vacancyId="vacancy-1"
        vacancyTitle="Senior Backend Developer"
        onClose={vi.fn()}
        onPublished={vi.fn()}
      />,
    );

    expect(screen.getByText(/Senior Backend Developer/)).toBeInTheDocument();
  });

  it('calls onClose when Annuleren is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <PublishConfirmModal
        open={true}
        vacancyId="vacancy-1"
        vacancyTitle="Senior Backend Developer"
        onClose={onClose}
        onPublished={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Annuleren' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('publishes and calls onPublished on success', async () => {
    const user = userEvent.setup();
    const published = { id: 'vacancy-1', status: 'PUBLISHED' } as unknown as VacancyResponse;
    vi.mocked(vacancyApi.publishVacancy).mockResolvedValue(published);
    const onPublished = vi.fn();
    render(
      <PublishConfirmModal
        open={true}
        vacancyId="vacancy-1"
        vacancyTitle="Senior Backend Developer"
        onClose={vi.fn()}
        onPublished={onPublished}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Ja, publiceer' }));

    expect(await screen.findByRole('button', { name: 'Ja, publiceer' })).toBeInTheDocument();
    expect(onPublished).toHaveBeenCalledWith(published);
  });

  it('surfaces a 409 error inside the modal without closing it', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.publishVacancy).mockRejectedValue({
      status: 409,
      title: 'Vacancy cannot be published in its current state.',
    });
    const onClose = vi.fn();
    const onPublished = vi.fn();
    render(
      <PublishConfirmModal
        open={true}
        vacancyId="vacancy-1"
        vacancyTitle="Senior Backend Developer"
        onClose={onClose}
        onPublished={onPublished}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Ja, publiceer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/kan nu niet worden gepubliceerd/);
    expect(onClose).not.toHaveBeenCalled();
    expect(onPublished).not.toHaveBeenCalled();
  });
});
