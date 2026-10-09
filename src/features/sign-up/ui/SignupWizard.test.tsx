import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { accountApi } from '../../../entities/account';
import { SignupWizard } from './SignupWizard';

vi.mock('../../../entities/account', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/account')>('../../../entities/account');
  return {
    ...actual,
    accountApi: { signUp: vi.fn(), getVerificationStatus: vi.fn(), resendVerification: vi.fn() },
  };
});

function renderWizard() {
  const onCompleted = vi.fn();
  render(<SignupWizard onCompleted={onCompleted} />);
  return { user: userEvent.setup(), onCompleted };
}

async function fillUntilRole(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Voornaam'), 'Sanne{Enter}');
  await user.type(screen.getByLabelText('Achternaam'), 'de Vries{Enter}');
  await user.type(screen.getByLabelText('Werk e-mail'), 'sanne@bedrijf.nl{Enter}');
}

describe('SignupWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('starts on the first-name question with the logo, step caption and focus in the field', () => {
    renderWizard();

    expect(screen.getByRole('heading', { name: 'Hoe heet je?' })).toBeInTheDocument();
    expect(screen.getByText('Stap 1 van 4')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Jobzy' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Terug' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Voornaam')).toHaveFocus();
    expect(screen.getByRole('img', { name: 'Illustratie: iemand zwaait hallo' })).toBeInTheDocument();
  });

  it('keeps "Volgende" disabled until the field has a non-blank value', async () => {
    const { user } = renderWizard();
    const next = screen.getByRole('button', { name: 'Volgende' });

    expect(next).toBeDisabled();
    await user.type(screen.getByLabelText('Voornaam'), '   ');
    expect(next).toBeDisabled();
    await user.type(screen.getByLabelText('Voornaam'), 'Sanne');
    expect(next).toBeEnabled();
  });

  it('advances on Enter and shows a back button from step 2', async () => {
    const { user } = renderWizard();

    await user.type(screen.getByLabelText('Voornaam'), 'Sanne{Enter}');

    expect(screen.getByRole('heading', { name: 'En je achternaam?' })).toBeInTheDocument();
    expect(screen.getByText('Stap 2 van 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Terug' })).toBeInTheDocument();
    expect(screen.getByLabelText('Achternaam')).toHaveFocus();
  });

  it('keeps entered values when navigating back', async () => {
    const { user } = renderWizard();

    await user.type(screen.getByLabelText('Voornaam'), 'Sanne{Enter}');
    await user.type(screen.getByLabelText('Achternaam'), 'de Vries{Enter}');
    await user.click(screen.getByRole('button', { name: 'Terug' }));
    expect(screen.getByLabelText('Achternaam')).toHaveValue('de Vries');

    await user.click(screen.getByRole('button', { name: 'Terug' }));
    expect(screen.getByLabelText('Voornaam')).toHaveValue('Sanne');
  });

  it('refuses a personal mailbox with the design copy, and clears the error on edit', async () => {
    const { user } = renderWizard();
    await user.type(screen.getByLabelText('Voornaam'), 'Sanne{Enter}');
    await user.type(screen.getByLabelText('Achternaam'), 'de Vries{Enter}');

    const email = screen.getByLabelText('Werk e-mail');
    expect(screen.getByText('we sturen hier een verificatielink naartoe')).toBeInTheDocument();
    await user.type(email, 'sanne@gmail.com{Enter}');

    expect(screen.getByText('Dit lijkt geen werk e-mail — check je bedrijfsdomein.')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Dit lijkt geen werk e-mail — check je bedrijfsdomein.');
    expect(screen.getByRole('heading', { name: 'Wat is je werk e-mail?' })).toBeInTheDocument();

    await user.type(email, 'x');
    expect(screen.queryByText('Dit lijkt geen werk e-mail — check je bedrijfsdomein.')).not.toBeInTheDocument();
  });

  it('offers the four roles and keeps "Account maken" disabled until one is picked', async () => {
    const { user } = renderWizard();
    await fillUntilRole(user);

    expect(screen.getByRole('heading', { name: 'Wat is je rol?' })).toBeInTheDocument();
    const role = screen.getByLabelText('Rol');
    expect(Array.from((role as HTMLSelectElement).options).map((option) => option.text)).toEqual([
      'Kies je rol',
      'Owner',
      'Hiring Manager',
      'HR-Manager',
      'Recruiter',
    ]);
    expect(screen.getByRole('button', { name: 'Account maken' })).toBeDisabled();

    await user.selectOptions(role, 'HR-Manager');
    expect(screen.getByRole('button', { name: 'Account maken' })).toBeEnabled();
  });

  it('creates the account with trimmed values and reports completion', async () => {
    vi.mocked(accountApi.signUp).mockResolvedValue({ accountId: 'account-1', verificationStatus: 'PENDING' });
    const { user, onCompleted } = renderWizard();

    await user.type(screen.getByLabelText('Voornaam'), ' Sanne {Enter}');
    await user.type(screen.getByLabelText('Achternaam'), 'de Vries{Enter}');
    await user.type(screen.getByLabelText('Werk e-mail'), 'sanne@bedrijf.nl {Enter}');
    await user.selectOptions(screen.getByLabelText('Rol'), 'Recruiter');
    await user.click(screen.getByRole('button', { name: 'Account maken' }));

    expect(accountApi.signUp).toHaveBeenCalledWith({
      firstName: 'Sanne',
      lastName: 'de Vries',
      email: 'sanne@bedrijf.nl',
      role: 'RECRUITER',
    });
    expect(onCompleted).toHaveBeenCalledWith({ accountId: 'account-1', verificationStatus: 'PENDING' });
  });

  it('shows a calm error and stays on the role step when signup fails', async () => {
    vi.mocked(accountApi.signUp).mockRejectedValue({ status: 503, title: 'down' });
    const { user, onCompleted } = renderWizard();
    await fillUntilRole(user);
    await user.selectOptions(screen.getByLabelText('Rol'), 'Owner');

    await user.click(screen.getByRole('button', { name: 'Account maken' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Er ging iets mis aan onze kant — probeer het zo weer.',
    );
    expect(onCompleted).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Account maken' })).toBeEnabled();
  });
});
