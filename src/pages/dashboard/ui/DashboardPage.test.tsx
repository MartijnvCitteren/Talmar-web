import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { saveSignupSession } from '../../../entities/account';
import { DashboardPage } from './DashboardPage';

function renderDashboard() {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vacancies/new" element={<p>new vacancy route</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DashboardPage (first visit)', () => {
  beforeEach(() => sessionStorage.clear());

  it('greets the new account by first name', () => {
    saveSignupSession({ accountId: 'account-1', firstName: 'Sanne' });
    renderDashboard();

    expect(screen.getByRole('heading', { level: 1, name: 'Welkom, Sanne' })).toBeInTheDocument();
    expect(screen.getByText('Je account is bevestigd — je kan direct aan de slag.')).toBeInTheDocument();
  });

  it('falls back to a plain welcome without a known name', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { level: 1, name: 'Welkom' })).toBeInTheDocument();
  });

  it('shows the empty state with the Dashboard nav item active', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: 'Nog geen vacatures' })).toBeInTheDocument();
    expect(
      screen.getByText('Zodra je een vacature plaatst, zie je hier je pipeline en kandidaten.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('aria-current', 'page');
  });

  it('starts a new vacancy from the empty state', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Nieuwe vacature' }));

    expect(screen.getByText('new vacancy route')).toBeInTheDocument();
  });
});
