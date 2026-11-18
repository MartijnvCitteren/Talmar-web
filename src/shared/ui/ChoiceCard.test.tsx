import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil } from 'lucide-react';
import { ChoiceCard } from './ChoiceCard';

describe('ChoiceCard', () => {
  it('renders title and body and calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ChoiceCard
        icon={<Pencil size={22} aria-hidden="true" />}
        title="Zelf schrijven"
        body="Je hebt de tekst al klaarliggen."
        selected={false}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('Zelf schrijven')).toBeInTheDocument();
    expect(screen.getByText('Je hebt de tekst al klaarliggen.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Zelf schrijven/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('reflects the selected state via aria-pressed', () => {
    render(
      <ChoiceCard
        icon={<Pencil size={22} aria-hidden="true" />}
        title="Zelf schrijven"
        body="Body"
        selected={true}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Zelf schrijven/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies the advice variant styling hook', () => {
    render(
      <ChoiceCard
        icon={<Pencil size={22} aria-hidden="true" />}
        title="Taldo stelt een concept op"
        body="Body"
        selected={false}
        onSelect={vi.fn()}
        variant="advice"
      />,
    );

    expect(screen.getByRole('button', { name: /Taldo stelt een concept op/ })).toHaveAttribute(
      'data-variant',
      'advice',
    );
  });
});
