import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DeepPartial } from 'keycloakify/tools/DeepPartial';
import type { KcContext } from '../KcContext';
import { getKcContextMock } from '../KcPageStory';
import KcPage from '../KcPage';

vi.mock('keycloakify/login/Template.useInitialize', () => ({ useInitialize: () => ({ isReadyToRender: true }) }));

function renderPage<PageId extends KcContext['pageId']>(
  pageId: PageId,
  overrides?: DeepPartial<Extract<KcContext, { pageId: PageId }>>,
) {
  const kcContext = getKcContextMock({ pageId, overrides });
  render(<KcPage kcContext={kcContext} />);
  return { user: userEvent.setup(), kcContext };
}

let postListener: ((event: Event) => void) | undefined;

/** For each form submit: whether the page let it through to Keycloak (jsdom can't navigate). */
function recordPosts(): boolean[] {
  const posted: boolean[] = [];
  postListener = (event: Event) => {
    posted.push(!event.defaultPrevented);
    event.preventDefault();
  };
  window.addEventListener('submit', postListener);
  return posted;
}

afterEach(() => {
  if (postListener) {
    window.removeEventListener('submit', postListener);
    postListener = undefined;
  }
});

const currentStep = () =>
  within(screen.getByRole('navigation', { name: 'Je aanmelding' }))
    .getAllByRole('listitem')
    .find((item) => item.getAttribute('aria-current') === 'step');

describe('login-verify-email.ftl', () => {
  it('shows the address the mail went to, as the second sign-up step', async () => {
    renderPage('login-verify-email.ftl');

    expect(await screen.findByRole('heading', { name: 'Check je inbox' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('sanne@bedrijf.nl')).toBeInTheDocument();
    expect(currentStep()).toHaveTextContent('Mailadres bevestigen');
    const badge = screen.getByRole('figure', { name: 'Voorbeeld van je account' });
    expect(within(badge).getByText('Bedrijf')).toBeInTheDocument();
    expect(within(badge).getByText('Mail onderweg')).toBeInTheDocument();
  });

  it('offers to send the mail again through Keycloak', async () => {
    const { kcContext } = renderPage('login-verify-email.ftl');

    expect(await screen.findByRole('link', { name: 'Stuur de mail opnieuw' })).toHaveAttribute(
      'href',
      kcContext.url.loginAction,
    );
  });

  it("doesn't repeat Keycloak's 'verify your e-mail' warning", async () => {
    renderPage('login-verify-email.ftl', {
      message: { type: 'warning', summary: 'U moet uw e-mailadres verifiëren.' },
    });
    await screen.findByRole('heading', { name: 'Check je inbox' });
    expect(screen.queryByText('U moet uw e-mailadres verifiëren.')).not.toBeInTheDocument();
  });

  it('confirms a resend', async () => {
    renderPage('login-verify-email.ftl', {
      message: { type: 'success', summary: 'We hebben de mail opnieuw gestuurd.' },
    });
    expect(await screen.findByRole('status')).toHaveTextContent('We hebben de mail opnieuw gestuurd.');
  });
});

describe('login-update-password.ftl', () => {
  it('asks for a new password as the third sign-up step', async () => {
    renderPage('login-update-password.ftl');

    expect(await screen.findByRole('heading', { name: 'Kies een wachtwoord' })).toBeInTheDocument();
    expect(currentStep()).toHaveTextContent('Wachtwoord kiezen');
    expect(screen.getByLabelText('Wachtwoord')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('catches an empty password and two passwords that differ before posting', async () => {
    const { user } = renderPage('login-update-password.ftl');
    const save = await screen.findByRole('button', { name: 'Wachtwoord opslaan' });
    const posted = recordPosts();

    await user.click(save);
    expect(screen.getByLabelText('Wachtwoord')).toHaveAccessibleDescription('Kies nog een wachtwoord.');
    expect(screen.getByLabelText('Wachtwoord')).toHaveFocus();

    await user.type(screen.getByLabelText('Wachtwoord'), 'een lange zin als wachtwoord');
    await user.type(screen.getByLabelText('Herhaal je wachtwoord'), 'een lange zin');
    await user.click(save);
    expect(screen.getByLabelText('Herhaal je wachtwoord')).toHaveAccessibleDescription(
      'De wachtwoorden zijn niet hetzelfde.',
    );

    expect(posted).toEqual([false, false]);
  });

  it('posts both fields, with the username for password managers, to Keycloak', async () => {
    const { user, kcContext } = renderPage('login-update-password.ftl');
    const posted = recordPosts();

    await user.type(await screen.findByLabelText('Wachtwoord'), 'een lange zin als wachtwoord');
    await user.type(screen.getByLabelText('Herhaal je wachtwoord'), 'een lange zin als wachtwoord');
    await user.click(screen.getByRole('button', { name: 'Wachtwoord opslaan' }));

    const form = document.getElementById('kc-passwd-update-form') as HTMLFormElement;
    expect(posted).toEqual([true]);
    expect(form.getAttribute('action')).toBe(kcContext.url.loginAction);
    expect(Object.fromEntries(new FormData(form))).toEqual({
      username: 'sanne@bedrijf.nl',
      'password-new': 'een lange zin als wachtwoord',
      'password-confirm': 'een lange zin als wachtwoord',
    });
  });

  it("shows Keycloak's password policy error on the field", async () => {
    renderPage('login-update-password.ftl', {
      messagesPerField: {
        existsError: (...names: string[]) => names.includes('password'),
        get: (name: string) => (name === 'password' ? 'Je wachtwoord heeft minimaal 12 tekens nodig.' : ''),
        exists: (name: string) => name === 'password',
      },
    });

    expect(await screen.findByLabelText('Wachtwoord')).toHaveAccessibleDescription(
      'Je wachtwoord heeft minimaal 12 tekens nodig.',
    );
  });

  it('is a plain password change, not a sign-up step, when the app asks for it', async () => {
    renderPage('login-update-password.ftl', { isAppInitiatedAction: true });

    await screen.findByRole('heading', { name: 'Kies een wachtwoord' });
    expect(screen.queryByRole('navigation', { name: 'Je aanmelding' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Log uit op je andere apparaten' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuleren' })).toHaveAttribute('name', 'cancel-aia');
  });
});

describe('info.ftl', () => {
  it('shows the message and the one way on as a button-like link', async () => {
    renderPage('info.ftl', {
      messageHeader: undefined,
      message: { type: 'info', summary: 'Klopt het dat sanne@bedrijf.nl jouw mailadres is?' },
      actionUri: 'https://auth.example/action',
      pageRedirectUri: undefined,
      skipLink: false,
    });

    expect(await screen.findByRole('heading', { name: 'Nog één ding' })).toBeInTheDocument();
    expect(screen.getByText('Klopt het dat sanne@bedrijf.nl jouw mailadres is?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ga verder' })).toHaveAttribute('href', 'https://auth.example/action');
  });
});
