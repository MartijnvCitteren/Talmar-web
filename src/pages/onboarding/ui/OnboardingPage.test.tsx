import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { accountApi } from '../../../entities/account';
import { OnboardingPage } from './OnboardingPage';

vi.mock('../../../entities/account', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/account')>('../../../entities/account');
  return { ...actual, accountApi: { onboard: vi.fn() } };
});

beforeEach(() => {
  vi.mocked(accountApi.onboard).mockReset();
});

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/vacancies/new" element={<p>Nieuwe vacature</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

describe('OnboardingPage', () => {
  it('is the last of the four sign-up steps', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Wat is je rol?' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Je rol');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('shows the picked role on the account badge beside the form', async () => {
    const user = renderPage();
    const badge = screen.getByRole('figure', { name: 'Voorbeeld van je account' });
    expect(within(badge).getByText('Kies je rol')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Oprichter of directeur/ }));

    expect(within(badge).getByText('Oprichter of directeur')).toBeInTheDocument();
  });

  it('goes into the app once the account is active', async () => {
    vi.mocked(accountApi.onboard).mockResolvedValue({ status: 'ACTIVE' });
    const user = renderPage();

    await user.click(screen.getByRole('radio', { name: /Recruiter/ }));
    await user.click(screen.getByRole('button', { name: 'Account afronden' }));

    expect(await screen.findByText('Nieuwe vacature')).toBeInTheDocument();
  });

  it("says the company's owner still has to approve a member who joined an existing company", async () => {
    vi.mocked(accountApi.onboard).mockResolvedValue({ status: 'PENDING_APPROVAL' });
    const user = renderPage();

    await user.click(screen.getByRole('radio', { name: /Hiring manager/ }));
    await user.click(screen.getByRole('button', { name: 'Account afronden' }));

    expect(await screen.findByRole('heading', { name: 'Je bedrijf moet je nog toelaten' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('Wacht op goedkeuring')).toBeInTheDocument();
    expect(within(screen.getByRole('figure', { name: 'Voorbeeld van je account' })).getByText('Wacht op goedkeuring')).toBeInTheDocument();
    expect(screen.queryByRole('listitem', { current: 'step' })).not.toBeInTheDocument();
  });
});
