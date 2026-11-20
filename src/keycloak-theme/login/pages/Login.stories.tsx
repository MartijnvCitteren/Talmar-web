import type { Meta, StoryObj } from '@storybook/react-vite';
import { createKcPageStory } from '../KcPageStory';

const { KcPageStory } = createKcPageStory({ pageId: 'login.ftl' });

/** Not ejected yet: Keycloak's own login page with the Taldo brand override (fallback.css). */
const meta = {
  title: 'login/login.ftl (fallback)',
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
