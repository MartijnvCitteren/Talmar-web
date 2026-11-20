import type { DeepPartial } from 'keycloakify/tools/DeepPartial';
import { createGetKcContextMock } from 'keycloakify/login/KcContext';
import type { KcContext, KcContextExtension, KcContextExtensionPerPage } from './KcContext';
import KcPage from './KcPage';
import { themeNames, kcEnvDefaults } from '../kc.gen';

const kcContextExtension: KcContextExtension = {
  themeName: themeNames[0],
  properties: {
    ...kcEnvDefaults,
  },
};
const kcContextExtensionPerPage: KcContextExtensionPerPage = {};

// Mirrors the taldo realm (taldo-api/docker/keycloak/taldo-realm.json) so stories behave like
// the real pages: e-mail is the username, Dutch is the default language, same User Profile rules.
const PERSON_NAME_PATTERN = "^(?=.*\\p{L})[\\p{L}\\p{M}'’.-]+( [\\p{L}\\p{M}'’.-]+)*$";
const WORK_EMAIL_PATTERN =
  '(?i)^[^@]+@(?!(?:gmail[.]com|googlemail[.]com|icloud[.]com|ziggo[.]nl|kpnmail[.]nl|xs4all[.]nl)$)(?!(?:outlook|hotmail|live|yahoo|aol|gmx|yandex)[.]).+$';

const personName = (name: 'firstName' | 'lastName') => ({
  name,
  displayName: `\${${name}}`,
  required: true,
  readOnly: false,
  annotations: {},
  autocomplete: undefined,
  validators: {
    length: { min: 1, max: 35 },
    pattern: { pattern: PERSON_NAME_PATTERN, 'error-message': 'invalidPersonName' },
  },
});

export const { getKcContextMock } = createGetKcContextMock({
  kcContextExtension,
  kcContextExtensionPerPage,
  overrides: {
    realm: {
      name: 'taldo',
      displayName: 'Taldo',
      displayNameHtml: 'Taldo',
      registrationEmailAsUsername: true,
      internationalizationEnabled: true,
    },
    locale: {
      currentLanguageTag: 'nl',
      supported: [
        { languageTag: 'nl', label: 'Nederlands', url: '?kc_locale=nl' },
        { languageTag: 'en', label: 'English', url: '?kc_locale=en' },
      ],
    },
  },
  overridesPerPage: {
    'register.ftl': {
      passwordRequired: true,
      passwordPolicies: { length: 12, maxLength: 128, notEmail: true },
      profile: {
        attributesByName: {
          username: undefined,
          email: {
            name: 'email',
            displayName: '${email}',
            required: true,
            readOnly: false,
            annotations: {},
            autocomplete: 'email',
            validators: {
              email: {},
              length: { max: '75' },
              pattern: { pattern: WORK_EMAIL_PATTERN, 'error-message': 'publicEmailDomainNotAllowed' },
            },
          },
          firstName: personName('firstName'),
          lastName: personName('lastName'),
        },
      },
    },
  },
});

export function createKcPageStory<PageId extends KcContext['pageId']>(params: { pageId: PageId }) {
  const { pageId } = params;

  function KcPageStory(props: { kcContext?: DeepPartial<Extract<KcContext, { pageId: PageId }>> }) {
    const { kcContext: overrides } = props;

    const kcContextMock = getKcContextMock({
      pageId,
      overrides,
    });

    return <KcPage kcContext={kcContextMock} />;
  }

  return { KcPageStory };
}
