import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingLayout } from './OnboardingLayout';

describe('OnboardingLayout', () => {
  it('renders the leading slot, the caption and the content', () => {
    render(
      <OnboardingLayout leading={<span>logo</span>} caption="Stap 1 van 4">
        <p>content</p>
      </OnboardingLayout>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('logo');
    expect(screen.getByText('Stap 1 van 4')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('content');
  });

  it('omits the caption when none is given', () => {
    render(
      <OnboardingLayout leading={<span>logo</span>}>
        <p>content</p>
      </OnboardingLayout>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent(/^logo$/);
  });
});
