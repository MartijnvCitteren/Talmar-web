import type { Meta, StoryObj } from '@storybook/react-vite';
import { createKcPageStory } from '../KcPageStory';

const { KcPageStory } = createKcPageStory({ pageId: 'info.ftl' });

const meta = {
  title: 'login/info.ftl',
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The verification link opened in another browser than the one used to register. */
export const ConfirmEmail: Story = {
  args: {
    kcContext: {
      messageHeader: undefined,
      message: { type: 'info', summary: 'Klopt het dat sanne@bedrijf.nl jouw mailadres is? Ga dan verder om het te bevestigen.' },
      actionUri: '#',
      pageRedirectUri: undefined,
      skipLink: false,
    },
  },
};
