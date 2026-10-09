import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { accountApi, saveSignupSession } from '../../../entities/account';
import { SignupVerifyPage } from './SignupVerifyPage';

vi.mock('../../../entities/account', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/account')>('../../../entities/account');
  return {
    ...actual,
    accountApi: { signUp: vi.fn(), getVerificationStatus: vi.fn(), resendVerification: vi.fn() },
  };
});

function renderAtVerify() {
  render(
    <MemoryRouter initialEntries={['/signup/verify']}>
      <Routes>
        <Route path="/signup" element={<p>signup route</p>} />
        <Route path="/signup/verify" element={<SignupVerifyPage />} />
        <Route path="/dashboard" element={<p>dashboard route</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SignupVerifyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('sends visitors who did not sign up in this tab back to /signup', () => {
    renderAtVerify();

    expect(screen.getByText('signup route')).toBeInTheDocument();
  });

  it('shows "Check je mail" under the logo while the account is unverified', async () => {
    vi.mocked(accountApi.getVerificationStatus).mockResolvedValue('PENDING');
    saveSignupSession({ accountId: 'account-1', firstName: 'Sanne' });

    renderAtVerify();

    expect(screen.getByRole('heading', { name: 'Check je mail' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Jobzy' })).toBeInTheDocument();
    expect(accountApi.getVerificationStatus).toHaveBeenCalledWith('account-1');
  });

  it('redirects to the dashboard once the mail link was clicked', async () => {
    vi.mocked(accountApi.getVerificationStatus).mockResolvedValue('VERIFIED');
    saveSignupSession({ accountId: 'account-1', firstName: 'Sanne' });

    renderAtVerify();

    expect(await screen.findByText('dashboard route')).toBeInTheDocument();
  });
});
