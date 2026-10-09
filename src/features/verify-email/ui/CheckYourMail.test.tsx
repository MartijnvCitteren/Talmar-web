import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { accountApi } from '../../../entities/account';
import { CheckYourMail } from './CheckYourMail';

vi.mock('../../../entities/account', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/account')>('../../../entities/account');
  return {
    ...actual,
    accountApi: { signUp: vi.fn(), getVerificationStatus: vi.fn(), resendVerification: vi.fn() },
  };
});

describe('CheckYourMail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(accountApi.getVerificationStatus).mockResolvedValue('PENDING');
  });
  afterEach(() => vi.useRealTimers());

  it('renders the design copy and illustration', () => {
    render(<CheckYourMail accountId="account-1" onVerified={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Check je mail' })).toBeInTheDocument();
    expect(
      screen.getByText('we stuurden een link naar je werk e-mail — klik erop om verder te gaan'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Illustratie: iemand bij een verzonden envelop met vinkje' }),
    ).toBeInTheDocument();
  });

  it('shows "Mail nog eens sturen" only after 30 seconds, and resends on click', async () => {
    vi.mocked(accountApi.resendVerification).mockResolvedValue();
    render(<CheckYourMail accountId="account-1" onVerified={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Mail nog eens sturen' })).not.toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(30_000));
    fireEvent.click(screen.getByRole('button', { name: 'Mail nog eens sturen' }));
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(accountApi.resendVerification).toHaveBeenCalledWith('account-1');
    expect(screen.getByRole('status')).toHaveTextContent('We hebben de mail nog eens gestuurd.');
    expect(screen.queryByRole('button', { name: 'Mail nog eens sturen' })).not.toBeInTheDocument();
  });

  it('calls onVerified when the account gets verified', async () => {
    vi.mocked(accountApi.getVerificationStatus).mockResolvedValue('VERIFIED');
    const onVerified = vi.fn();

    render(<CheckYourMail accountId="account-1" onVerified={onVerified} />);
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(onVerified).toHaveBeenCalledTimes(1);
  });
});
