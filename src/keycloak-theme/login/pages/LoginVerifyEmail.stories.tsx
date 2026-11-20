import type { Meta, StoryObj } from '@storybook/react-vite';
import { createKcPageStory } from '../KcPageStory';

const { KcPageStory } = createKcPageStory({ pageId: 'login-verify-email.ftl' });

const meta = {
  title: 'login/login-verify-email.ftl',
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Right after registering: Keycloak's "verify your e-mail" warning is not repeated. */
export const Default: Story = {
  args: { kcContext: { message: { type: 'warning', summary: 'U moet uw e-mailadres verifiëren.' } } },
};

export const MailSentAgain: Story = {
  args: {
    kcContext: {
      message: { type: 'success', summary: 'We hebben de mail opnieuw gestuurd. Hij kan een paar minuten onderweg zijn.' },
    },
  },
};

export const LongAddress: Story = {
  args: { kcContext: { user: { email: 'anne-marie.van-den-heuvel-de-graaf@logistiek-groep-noordoost.nl' } } },
};

export const English: Story = {
  args: { kcContext: { locale: { currentLanguageTag: 'en' } } },
};
