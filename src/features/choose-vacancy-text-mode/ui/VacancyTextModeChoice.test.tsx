import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VacancyTextModeChoice } from './VacancyTextModeChoice';

describe('VacancyTextModeChoice', () => {
  it('renders both choice cards and the advice card', () => {
    render(<VacancyTextModeChoice mode={null} onModeChange={vi.fn()} onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Zelf schrijven/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Taldo stelt een concept op/ })).toBeInTheDocument();
    expect(screen.getByText(/bespaart gemiddeld 20 minuten/)).toBeInTheDocument();
  });

  it('disables the primary button until a mode is picked', () => {
    render(<VacancyTextModeChoice mode={null} onModeChange={vi.fn()} onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Volgende' })).toBeDisabled();
  });

  it('calls onModeChange when a card is clicked', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(<VacancyTextModeChoice mode={null} onModeChange={onModeChange} onNext={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Zelf schrijven/ }));

    expect(onModeChange).toHaveBeenCalledWith('manual');
  });

  it('shows "Volgende" label and enabled state in manual mode', () => {
    render(<VacancyTextModeChoice mode="manual" onModeChange={vi.fn()} onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Volgende' })).toBeEnabled();
  });

  it('shows "Beantwoord 3 vragen" label in AI mode and fires onNext', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<VacancyTextModeChoice mode="ai" onModeChange={vi.fn()} onNext={onNext} />);

    const button = screen.getByRole('button', { name: 'Beantwoord 3 vragen' });
    expect(button).toBeEnabled();

    await user.click(button);

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
