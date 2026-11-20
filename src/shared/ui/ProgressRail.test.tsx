import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ProgressRail } from './ProgressRail';

const steps = [
  { label: 'Je gegevens', hint: 'Naam en werkmailadres' },
  { label: 'Mailadres bevestigen' },
  { label: 'Wachtwoord kiezen' },
];

describe('ProgressRail', () => {
  it('lists every step, marks the current one and the ones before it as done', () => {
    render(<ProgressRail steps={steps} currentIndex={1} label="Je aanmelding" summary="Stap 2 van 3" />);

    const items = within(screen.getByRole('navigation', { name: 'Je aanmelding' })).getAllByRole('listitem');
    expect(items.map((item) => item.dataset.status)).toEqual(['done', 'current', 'upcoming']);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).toHaveTextContent('Naam en werkmailadres');
  });

  it('marks everything done once past the last step', () => {
    render(<ProgressRail steps={steps} currentIndex={3} label="Je aanmelding" summary="Klaar" />);

    const items = screen.getAllByRole('listitem');
    expect(items.every((item) => item.dataset.status === 'done')).toBe(true);
    expect(items.some((item) => item.hasAttribute('aria-current'))).toBe(false);
  });
});
