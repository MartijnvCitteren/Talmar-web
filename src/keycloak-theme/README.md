# Taldo Keycloak theme

The Keycloak **login theme** `taldo`, built with [Keycloakify](https://docs.keycloakify.dev)
11.16 for Keycloak 26 (`quay.io/keycloak/keycloak:26.8.1`, see `taldo-api/docker-compose.yaml`).
Users sign up and sign in on Keycloak's own pages; this theme makes those pages Taldo.

It lives inside this app (Keycloakify's "install in your SPA" setup), so it uses the app's
design system directly: `src/app/styles/tokens.css` and the components in `src/shared/ui`.
Nothing is copied. `src/main.tsx` picks the entry: Keycloak sets `window.kcContext` on its
pages, then the theme renders, otherwise the app boots.

## What's in it

| Page | Status |
| --- | --- |
| `register.ftl` | Ejected: `login/pages/Register.tsx`, one question per screen in the Taldo `Template` |
| everything else (login, reset password, verify e-mail, …) | Keycloak's default markup, brought on brand by `login/fallback.css` (fonts, colours, radii) |

- `login/Template.tsx`: the Taldo shell (card, header bar, global message, language
  links). Login and reset-password will reuse it when they get ejected.
- `login/i18n.ts`: Dutch (default, informal "je") and English copy, including the
  register-related Keycloak error messages. Keycloakify ships these in the JAR, so
  messages Keycloak renders server-side use them too.
- `login/pages/register/steps.ts`: how User Profile attributes become steps. Order: first
  name, last name, e-mail, then any other attribute, then the password (if Keycloak asks for
  one). A new attribute in the realm's User Profile gets its own step without code changes;
  its question is its display name until it gets a `registerQuestion…` message.
- `login/pages/register/javaPatterns.ts`: the realm's User Profile patterns are Java
  regexes. Keycloakify checks them in the browser with a plain `new RegExp`, which throws on
  `(?i)` and never matches `\p{L}` (no `u` flag). Those patterns are translated and checked
  here instead; Keycloak still validates everything on submit.

Fonts (Inter, JetBrains Mono) come from `@fontsource-variable/*` and are bundled into the
JAR. The page loads nothing from third parties: no font CDN, analytics or other scripts.
The one exception is Google reCAPTCHA, and only if a realm turns it on.

## Develop

```bash
npm run storybook     # http://localhost:6006, stories under "login/register.ftl"
```

Stories: empty form, field errors, e-mail already exists, password policy violation,
global error, terms required, English. Mobile and desktop viewports are in the toolbar.

Against a real Keycloak (needs Docker and Maven):

```bash
# 1. Start taldo-api's compose stack first (it provides Mailpit, http://localhost:8025).
# 2. Then, from this repo:
npx keycloakify start-keycloak
```

This runs Keycloak 26.8.1 on **http://localhost:8180** (8080 is taldo-api's own Keycloak) with
the theme mounted, rebuilding on change. It imports `dev/taldo-dev-realm.json` as
`myrealm`: Keycloakify's dev realm with the taldo realm's registration, User Profile,
password policy and SMTP settings, plus `nl`/`en` with `nl` as default. Its mail goes to
taldo-api's Mailpit, because the container joins the `taldo-infra_default` network.
Changes you make in the admin console (admin/admin) are kept in `.keycloakify/`
(git-ignored), not in the committed dev realm.

Open the registration page directly:

```
http://localhost:8180/realms/myrealm/protocol/openid-connect/registrations?client_id=myclient&response_type=code&scope=openid&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2F&code_challenge=6l0KiXVar3Li1O3QJfEQshncznzBi8m8zFz4QhS4Dec&code_challenge_method=S256
```

Register any address on a non-public mail domain; the verification mail shows up in Mailpit.

## Build

```bash
npm run build-keycloak-theme
```

Produces `dist_keycloak/taldo-keycloak-theme.jar`. Only the Keycloak 22+ JAR is built
(`keycloakVersionTargets` in `vite.config.ts`).

## Deploy

1. Put the JAR in Keycloak's providers directory: `/opt/keycloak/providers/`. For the
   taldo-api compose stack, a volume like this on the `keycloak` service:
   ```yaml
   - ../taldo-web/dist_keycloak/taldo-keycloak-theme.jar:/opt/keycloak/providers/taldo-keycloak-theme.jar:ro
   ```
   For an optimized production image, copy it in before `kc.sh build`.
2. Restart Keycloak.
3. Set the realm's login theme and languages. In the realm JSON:
   ```json
   "loginTheme": "taldo",
   "internationalizationEnabled": true,
   "supportedLocales": ["nl", "en"],
   "defaultLocale": "nl"
   ```
   Without `internationalizationEnabled`, Keycloak only ever renders English.

To open the pages in a given language, the app can pass `ui_locales=nl` (or `en`) on the
authorization request.

## Password at registration

With `verifyEmail` on (as in the taldo realm), Keycloak 26.8 leaves the password **out**
of the registration form. The user sets it after clicking the verification link
(`UPDATE_PASSWORD` page). The register page then has 3 steps. To ask for the password on the
form (4 steps, as in the design), configure the realm's **Password Validation** registration
execution:

```json
{
  "alias": "password-on-register-form",
  "config": { "always_set_password_on_register_form": "true" }
}
```

(Admin console: Authentication → registration → Password Validation → ⚙ → "Always set
password on register form".) The theme handles both setups without code changes.
