import type { Meta, StoryObj } from '@storybook/react-vite';
import { createKcPageStory } from '../KcPageStory';

const { KcPageStory } = createKcPageStory({ pageId: 'login-update-password.ftl' });

const meta = {
  title: 'login/login-update-password.ftl',
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Sign-up: right after the link in the verification mail. */
export const Default: Story = {
  args: { kcContext: { message: { type: 'success', summary: 'Je mailadres is bevestigd.' } } },
};

export const PasswordPolicyViolation: Story = {
  args: {
    kcContext: {
      messagesPerField: {
        existsError: (...names: string[]) => names.includes('password'),
        get: (name: string) => (name === 'password' ? 'Je wachtwoord heeft minimaal 12 tekens nodig.' : ''),
        exists: (name: string) => name === 'password',
      },
    },
  },
};

/** Not sign-up: the app asked the user to change their password. */
export const AppInitiated: Story = {
  args: { kcContext: { isAppInitiatedAction: true } },
};

export const English: Story = {
  args: { kcContext: { locale: { currentLanguageTag: 'en' } } },
};
