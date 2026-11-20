import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { accountApi } from '../../../entities/account';
import { JobRoleForm } from './JobRoleForm';

vi.mock('../../../entities/account', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/account')>('../../../entities/account');
  return { ...actual, accountApi: { onboard: vi.fn() } };
});

beforeEach(() => {
  vi.mocked(accountApi.onboard).mockReset();
});

function renderForm() {
  const onDone = vi.fn();
  render(<JobRoleForm onDone={onDone} />);
  return { user: userEvent.setup(), onDone };
}

const finish = () => screen.getByRole('button', { name: 'Account afronden' });

describe('JobRoleForm', () => {
  it('offers the five job roles of the API as radio buttons', () => {
    renderForm();

    const roles = screen.getAllByRole('radio');
    expect(roles.map((role) => (role as HTMLInputElement).value)).toEqual([
      'RECRUITER',
      'HR',
      'HIRING_MANAGER',
      'FOUNDER_OR_DIRECTOR',
      'OTHER',
    ]);
    expect(screen.getByRole('radio', { name: /Hiring manager/ })).toBeInTheDocument();
  });

  it('asks to pick a role first instead of sending nothing', async () => {
    const { user } = renderForm();

    await user.click(finish());

    expect(screen.getByText('Kies de rol die het best bij je past.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Kies je rol' })).toHaveAttribute('aria-invalid', 'true');
    expect(accountApi.onboard).not.toHaveBeenCalled();
  });

  it('sends the chosen role and reports the account status', async () => {
    vi.mocked(accountApi.onboard).mockResolvedValue({ status: 'ACTIVE' });
    const { user, onDone } = renderForm();

    await user.click(screen.getByRole('radio', { name: /Oprichter of directeur/ }));
    await user.click(finish());

    expect(accountApi.onboard).toHaveBeenCalledWith('FOUNDER_OR_DIRECTOR');
    expect(onDone).toHaveBeenCalledWith('ACTIVE');
  });

  it('treats "already onboarded" (409) as done', async () => {
    vi.mocked(accountApi.onboard).mockRejectedValue({ status: 409, title: 'Conflict' });
    const { user, onDone } = renderForm();

    await user.click(screen.getByRole('radio', { name: /Recruiter/ }));
    await user.click(finish());

    expect(onDone).toHaveBeenCalledWith('ALREADY_ONBOARDED');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the choice and asks to try again when onboarding stopped halfway (503)', async () => {
    vi.mocked(accountApi.onboard)
      .mockRejectedValueOnce({ status: 503, title: 'Service Unavailable' })
      .mockResolvedValueOnce({ status: 'PENDING_APPROVAL' });
    const { user, onDone } = renderForm();

    await user.click(screen.getByRole('radio', { name: /HR/ }));
    await user.click(finish());

    expect(screen.getByRole('alert')).toHaveTextContent('Probeer het nog een keer; je keuze staat nog klaar.');
    expect(screen.getByRole('radio', { name: /HR/ })).toBeChecked();
    expect(onDone).not.toHaveBeenCalled();

    await user.click(finish());
    expect(accountApi.onboard).toHaveBeenNthCalledWith(2, 'HR');
    expect(onDone).toHaveBeenCalledWith('PENDING_APPROVAL');
  });

  it('explains a refused account (403) without raw codes', async () => {
    vi.mocked(accountApi.onboard).mockRejectedValue({ status: 403, title: 'Forbidden' });
    const { user } = renderForm();

    await user.click(screen.getByRole('radio', { name: /Iets anders/ }));
    await user.click(finish());

    expect(screen.getByRole('alert')).toHaveTextContent('dat kan alleen met een bevestigd werkmailadres');
  });
});
