import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './Logo';

describe('Logo', () => {
  it('exposes a single accessible name, whichever variant', () => {
    render(
      <>
        <Logo />
        <Logo variant="lockup" />
      </>,
    );

    expect(screen.getAllByRole('img', { name: 'Talmar' })).toHaveLength(2);
  });

  it('draws the official Talmar icon: a "t" with a dot on a rounded tile', () => {
    const { container } = render(<Logo />);

    expect(container.querySelector('rect[rx="29"]')).not.toBeNull();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 116 116');
  });

  it('adds the outlined wordmark only in the lockup', () => {
    const { container, rerender } = render(<Logo />);
    expect(container.querySelector('[data-part="wordmark"]')).toBeNull();

    rerender(<Logo variant="lockup" />);
    expect(container.querySelector('[data-part="wordmark"]')).not.toBeNull();
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 388 116');
  });

  it('sizes the icon from the design-system size scale', () => {
    render(<Logo size={48} />);
    expect(screen.getByRole('img', { name: 'Talmar' })).toHaveStyle({ '--logo-size': '48px' });
  });
});
