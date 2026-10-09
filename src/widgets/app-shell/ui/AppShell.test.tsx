import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

function renderShell(path = '/vacancies/new') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell>
        <div>content</div>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('renders the "Vacatures" nav item as active on a vacancy route and others as inactive', () => {
    renderShell();

    expect(screen.getByRole('link', { name: /Vacatures/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Dashboard/ })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /Kandidaten/ })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /Statistieken/ })).not.toHaveAttribute('aria-current');
  });

  it('marks the nav item of the current route as active', () => {
    renderShell('/dashboard');

    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Vacatures/ })).not.toHaveAttribute('aria-current');
  });

  it('renders an avatar chip with initials', () => {
    renderShell();

    expect(screen.getByText('MJ')).toBeInTheDocument();
  });

  it('renders the passed children content', () => {
    renderShell();

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('does not render the account menu until the avatar is clicked', () => {
    renderShell();

    expect(screen.queryByRole('menu', { name: 'Accountmenu' })).not.toBeInTheDocument();
  });

  it('opens the account menu on avatar click and renders its items', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: /MJ/ }));

    const menu = screen.getByRole('menu', { name: 'Accountmenu' });
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('Merel Janssen')).toBeInTheDocument();
    expect(within(menu).getByText('Jobzy')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Instellingen' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Support' })).toBeInTheDocument();
  });

  it('closes the account menu on outside mousedown', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: /MJ/ }));
    expect(screen.getByRole('menu', { name: 'Accountmenu' })).toBeInTheDocument();

    await user.click(screen.getByText('content'));

    expect(screen.queryByRole('menu', { name: 'Accountmenu' })).not.toBeInTheDocument();
  });

  it('toggles the menu closed when the avatar is clicked again', async () => {
    const user = userEvent.setup();
    renderShell();

    const avatarButton = screen.getByRole('button', { name: /MJ/ });
    await user.click(avatarButton);
    expect(screen.getByRole('menu', { name: 'Accountmenu' })).toBeInTheDocument();

    await user.click(avatarButton);
    expect(screen.queryByRole('menu', { name: 'Accountmenu' })).not.toBeInTheDocument();
  });
});
