import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { accountApi } from '../../../entities/account';
import { SignupPage } from './SignupPage';

vi.mock('../../../entities/account', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/account')>('../../../entities/account');
  return {
    ...actual,
    accountApi: { signUp: vi.fn(), getVerificationStatus: vi.fn(), resendVerification: vi.fn() },
  };
});

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('goes to the "check je mail" route once the account is created', async () => {
    vi.mocked(accountApi.signUp).mockResolvedValue({ accountId: 'account-1', verificationStatus: 'PENDING' });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/verify" element={<p>verify route</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Voornaam'), 'Sanne{Enter}');
    await user.type(screen.getByLabelText('Achternaam'), 'de Vries{Enter}');
    await user.type(screen.getByLabelText('Werk e-mail'), 'sanne@bedrijf.nl{Enter}');
    await user.selectOptions(screen.getByLabelText('Rol'), 'Owner');
    await user.click(screen.getByRole('button', { name: 'Account maken' }));

    expect(await screen.findByText('verify route')).toBeInTheDocument();
  });
});
