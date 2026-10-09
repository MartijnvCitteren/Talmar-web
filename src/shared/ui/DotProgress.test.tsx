import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DotProgress } from './DotProgress';

describe('DotProgress', () => {
  it('fills every dot up to and including the current step', () => {
    const { container } = render(<DotProgress current={2} total={4} />);

    const dots = Array.from(container.querySelectorAll('[data-on]'));
    expect(dots.map((dot) => dot.getAttribute('data-on'))).toEqual(['true', 'true', 'false', 'false']);
  });

  it('is hidden from assistive tech, since a text caption carries the progress', () => {
    const { container } = render(<DotProgress current={1} total={4} />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
