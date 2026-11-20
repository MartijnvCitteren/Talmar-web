import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DeepPartial } from 'keycloakify/tools/DeepPartial';
import type { KcContext } from '../KcContext';
import { getKcContextMock } from '../KcPageStory';
import KcPage from '../KcPage';

// Injects Keycloak's server-side scripts (session polling, reCAPTCHA); nothing to load in jsdom.
vi.mock('keycloakify/login/Template.useInitialize', () => ({ useInitialize: () => ({ isReadyToRender: true }) }));

type RegisterContext = Extract<KcContext, { pageId: 'register.ftl' }>;

function renderRegister(overrides?: DeepPartial<RegisterContext>) {
  const kcContext = getKcContextMock({ pageId: 'register.ftl', overrides });
  render(<KcPage kcContext={kcContext} />);
  return { user: userEvent.setup(), kcContext };
}

/** Keycloak's messagesPerField for a page it sent back with errors on some fields. */
function serverErrors(errors: Record<string, string>) {
  return {
    existsError: (...names: string[]) => names.some((name) => name in errors),
    get: (name: string) => errors[name] ?? '',
    exists: (name: string) => name in errors,
  };
}

/**
 * For each form submit: whether the page let it through to Keycloak. Listens on window, so it
 * runs after React's handler; then stops the post itself, since jsdom can't navigate.
 */
let postListener: ((event: Event) => void) | undefined;

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

const submit = () => screen.getByRole('button', { name: 'Account aanmaken' });

async function fillIn(user: ReturnType<typeof userEvent.setup>, email = 'sanne@bedrijf.nl') {
  await user.type(await screen.findByLabelText('Voornaam'), 'Zoë');
  await user.type(screen.getByLabelText('Achternaam'), "'t Hooft");
  await user.type(screen.getByLabelText('Werkmailadres'), email);
}

describe('Register', () => {
  it('asks for name and work email on one screen, in Dutch by default, without a password', async () => {
    renderRegister();

    expect(await screen.findByRole('heading', { name: 'Maak je account aan' })).toBeInTheDocument();
    expect(screen.getByLabelText('Voornaam')).toHaveAttribute('autocomplete', 'given-name');
    expect(screen.getByLabelText('Achternaam')).toHaveAttribute('autocomplete', 'family-name');
    expect(screen.getByLabelText('Werkmailadres')).toHaveAccessibleDescription('Hiermee koppelen we je aan je bedrijf.');
    expect(screen.queryByLabelText('Wachtwoord')).not.toBeInTheDocument();
  });

  it('shows the sign-up steps with this one current', async () => {
    renderRegister();

    const steps = await screen.findByRole('navigation', { name: 'Je aanmelding' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(4);
    expect(within(steps).getByText('Je gegevens').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('blocks an empty form, explains every missing field and focuses the first', async () => {
    const { user } = renderRegister();
    await screen.findByLabelText('Voornaam');
    const posted = recordPosts();

    await user.click(submit());

    expect(posted).toEqual([false]);
    expect(screen.getByLabelText('Voornaam')).toHaveAccessibleDescription('Vul dit veld nog even in.');
    expect(screen.getByLabelText('Achternaam')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Voornaam')).toHaveFocus();
  });

  it('fills in the account badge as you type, with the company taken from the mail domain', async () => {
    const { user } = renderRegister();
    const badge = await screen.findByRole('figure', { name: 'Voorbeeld van je account' });
    expect(within(badge).getByText('Je naam')).toBeInTheDocument();
    expect(within(badge).getByText('Je bedrijf')).toBeInTheDocument();

    await fillIn(user, 'zoe@acme-logistics.nl');

    expect(within(badge).getByText("Zoë 't Hooft")).toBeInTheDocument();
    expect(within(badge).getByText('Acme-logistics')).toBeInTheDocument();
    expect(within(badge).getByText('ZH')).toBeInTheDocument();
  });

  it('previews no company for a public mail provider', async () => {
    const { user } = renderRegister();
    await fillIn(user, 'zoe@gmail.com');

    const badge = screen.getByRole('figure', { name: 'Voorbeeld van je account' });
    expect(within(badge).getByText('Je bedrijf')).toBeInTheDocument();
  });

  it('turns down public mail providers before posting', async () => {
    const { user } = renderRegister();
    await fillIn(user, 'sanne@Gmail.com');
    const posted = recordPosts();

    await user.click(submit());

    expect(posted).toEqual([false]);
    expect(screen.getByLabelText('Werkmailadres')).toHaveAccessibleDescription(
      'Gebruik je werkmailadres. Adressen van publieke mailproviders kunnen we niet gebruiken.',
    );
    expect(screen.getByLabelText('Werkmailadres')).toHaveFocus();
  });

  it('accepts real names (the realm pattern uses Java-only \\p{L}) and posts the form to Keycloak', async () => {
    const { user, kcContext } = renderRegister();
    await fillIn(user);
    const form = document.getElementById('kc-register-form') as HTMLFormElement;
    const posted = recordPosts();

    await user.click(submit());

    expect(posted).toEqual([true]);
    expect(form.getAttribute('action')).toBe(kcContext.url.registrationAction);
    expect(Object.fromEntries(new FormData(form))).toMatchObject({
      firstName: 'Zoë',
      lastName: "'t Hooft",
      email: 'sanne@bedrijf.nl',
    });
  });

  it('also asks for a password when the realm puts it on the form', async () => {
    const { user } = renderRegister({ passwordRequired: true });
    await fillIn(user);

    expect(screen.getByLabelText('Wachtwoord')).toHaveAccessibleDescription('Minimaal 12 tekens.');
    await user.type(screen.getByLabelText('Wachtwoord'), 'lang-genoeg-wachtwoord');
    const posted = recordPosts();
    await user.click(submit());

    // One message per field: an empty confirmation asks to be filled in, not that it differs.
    expect(posted).toEqual([false]);
    expect(screen.getByLabelText('Herhaal je wachtwoord')).toHaveAccessibleDescription('Vul dit veld nog even in.');
    expect(screen.getByLabelText('Herhaal je wachtwoord')).toHaveFocus();
  });

  it('asks to accept the terms when the realm requires it, and only then submits', async () => {
    const { user } = renderRegister({ termsAcceptanceRequired: true });
    await fillIn(user);
    const form = document.getElementById('kc-register-form') as HTMLFormElement;
    const posted = recordPosts();

    await user.click(submit());
    await user.click(screen.getByRole('checkbox'));
    await user.click(submit());

    expect(posted).toEqual([false, true]);
    expect(new FormData(form).get('termsAccepted')).toBe('on');
  });

  it('focuses the email field when Keycloak reports the address already exists', async () => {
    renderRegister({
      profile: {
        attributesByName: {
          firstName: { value: 'Sanne' },
          lastName: { value: 'de Vries' },
          email: { value: 'sanne@bedrijf.nl' },
        },
      },
      messagesPerField: serverErrors({ email: 'Er is al een account met dit e-mailadres.' }),
    });

    const email = await screen.findByLabelText('Werkmailadres');
    expect(email).toHaveAccessibleDescription('Er is al een account met dit e-mailadres.');
    expect(email).toHaveFocus();
  });

  it('shows a global error from Keycloak as an alert', async () => {
    renderRegister({
      message: { type: 'error', summary: 'Er ging iets mis aan onze kant. Probeer het zo weer.' },
      messagesPerField: serverErrors({ global: 'Er ging iets mis aan onze kant. Probeer het zo weer.' }),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Er ging iets mis aan onze kant. Probeer het zo weer.');
  });

  it('speaks English when that is the chosen language', async () => {
    renderRegister({ locale: { currentLanguageTag: 'en' } });

    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4: Your details')).toBeInTheDocument();
  });

  it('links back to login', async () => {
    const { kcContext } = renderRegister();

    expect(await screen.findByRole('link', { name: 'Inloggen' })).toHaveAttribute('href', kcContext.url.loginUrl);
  });
});
