# Taldo Keycloak theme

The Keycloak **login theme** `taldo`, built with [Keycloakify](https://docs.keycloakify.dev)
11.16 for Keycloak 26 (`quay.io/keycloak/keycloak:26.8.1`, see `taldo-api/docker-compose.yaml`).
Users sign up and sign in on Keycloak's own pages; this theme makes those pages Taldo.

It lives inside this app (Keycloakify's "install in your SPA" setup), so it uses the app's
design system directly: `src/app/styles/tokens.css` and the components in `src/shared/ui`.
Nothing is copied. `src/main.tsx` picks the entry: Keycloak sets `window.kcContext` on its
pages, then the theme renders, otherwise the app boots.

## What's in it

Sign-up runs over four steps (taldo-api ADR 0006). The first three are Keycloak pages in this
theme; the last one is the app's `/onboarding` page. All four share one frame (`shared/ui`
`FlowLayout` with a `ProgressRail`), so the path reads as one, across Keycloak and the app. From
1024px a teal panel sits beside the form with an ID badge on a lanyard (`shared/ui` `IdBadge`)
that fills in step by step: name, the company previewed from the e-mail domain
(`shared/lib/company-from-email.ts`, the API's naming rule), e-mail status, role.

| Step | Page | Status |
| --- | --- | --- |
| 1. Your details | `register.ftl` | Ejected: `login/pages/Register.tsx`: first name, last name and work e-mail on one screen |
| 2. Confirm your e-mail | `login-verify-email.ftl` | Ejected: `login/pages/LoginVerifyEmail.tsx`: the address the mail went to, and "send again" |
| 3. Choose a password | `login-update-password.ftl` | Ejected: `login/pages/LoginUpdatePassword.tsx`: Keycloak's `UPDATE_PASSWORD` action after the link |
| 4. Your role | app: `src/pages/onboarding` | `POST /onboarding` with the job role (IdentityApi.yml) |
| – | `info.ftl` | Ejected: `login/pages/Info.tsx`, e.g. "is this your address?" when the link opens in another browser |
| – | everything else (login, reset password, …) | Keycloak's default markup, brought on brand by `login/fallback.css` (fonts, colours, radii) |

- `login/Template.tsx`: the Taldo shell for ejected pages (logo, language links, global
  message, the sign-up steps when a page passes `signupStep`, and the wide-screen panel when
  it passes `aside`, e.g. `login/SignupPanel.tsx`). Built on `shared/ui`
  `FlowLayout`, which the app's onboarding page uses too.
- `login/signupSteps.ts`: the four sign-up steps and their copy keys. The app's onboarding
  page has the same four in Dutch; change both together.
- `login/i18n.ts`: Dutch (default, informal "je") and English copy, including the Keycloak
  messages the sign-up pages can show. Keycloakify ships these in the JAR, so messages
  Keycloak renders server-side use them too.
- `login/pages/Register.tsx` renders the User Profile attributes Keycloak sends: first name,
  last name, e-mail, then any other attribute, then the password if the realm puts it on the
  form. A new attribute in the realm's User Profile shows up without code changes.
- `login/pages/register/javaPatterns.ts`: the realm's User Profile patterns are Java
  regexes. Keycloakify checks them in the browser with a plain `new RegExp`, which throws on
  `(?i)` and never matches `\p{L}` (no `u` flag). Those patterns are translated and checked
  here instead; Keycloak still validates everything on submit.

Fonts (Inter, JetBrains Mono) come from `@fontsource-variable/*` and are bundled into the
JAR. The page loads nothing from third parties: no font CDN, analytics or other scripts.
The one exception is Google reCAPTCHA, and only if a realm turns it on.

## Develop

```bash
npm run storybook     # http://localhost:6006, stories under "login/…"
```

Stories per page (register, verify e-mail, update password, info): empty, field and server
errors, English. Mobile and desktop viewports are in the toolbar.

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
(`login-update-password.ftl`, step 3). To ask for the password on the register form instead,
configure the realm's **Password Validation** registration execution:

```json
{
  "alias": "password-on-register-form",
  "config": { "always_set_password_on_register_form": "true" }
}
```

(Admin console: Authentication → registration → Password Validation → ⚙ → "Always set
password on register form".) The register page then shows the password fields too; the
update-password step is skipped by Keycloak.
