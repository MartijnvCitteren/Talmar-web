import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { descriptionApi } from '../../../entities/vacancy-description';
import { useGenerateVacancyDescription } from './useGenerateVacancyDescription';

vi.mock('../../../entities/vacancy-description', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/vacancy-description')>(
    '../../../entities/vacancy-description',
  );
  return {
    ...actual,
    descriptionApi: {
      generateDescription: vi.fn(),
      getGenerationStatus: vi.fn(),
      saveDescription: vi.fn(),
    },
  };
});

const inputs = { mostImportantTasks: 'Build things', team: 'Backend team', whyNiceJob: 'Great impact' };

describe('useGenerateVacancyDescription', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(descriptionApi.generateDescription).mockReset();
    vi.mocked(descriptionApi.getGenerationStatus).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('transitions idle -> generating -> ready with the generated description', async () => {
    vi.mocked(descriptionApi.generateDescription).mockResolvedValue({
      generationId: 'gen-1',
      status: 'PENDING',
    });
    vi.mocked(descriptionApi.getGenerationStatus)
      .mockResolvedValueOnce({ generationId: 'gen-1', status: 'PENDING' })
      .mockResolvedValueOnce({
        generationId: 'gen-1',
        status: 'COMPLETED',
        description: { summary: 'Generated summary', jobDescription: 'Role text', tasks: 'Task list' },
      });

    const { result } = renderHook(() => useGenerateVacancyDescription('vacancy-1'));
    expect(result.current.phase).toBe('idle');

    act(() => {
      result.current.start(inputs);
    });
    await waitFor(() => expect(result.current.phase).toBe('generating'));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await waitFor(() => expect(result.current.phase).toBe('ready'));
    expect(result.current.result).toEqual({
      summary: 'Generated summary',
      jobDescription: 'Role text',
      tasks: 'Task list',
    });
  });

  it('transitions idle -> generating -> failed when the status is FAILED', async () => {
    vi.mocked(descriptionApi.generateDescription).mockResolvedValue({
      generationId: 'gen-1',
      status: 'PENDING',
    });
    vi.mocked(descriptionApi.getGenerationStatus).mockResolvedValue({
      generationId: 'gen-1',
      status: 'FAILED',
    });

    const { result } = renderHook(() => useGenerateVacancyDescription('vacancy-1'));

    act(() => {
      result.current.start(inputs);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await waitFor(() => expect(result.current.phase).toBe('failed'));
    expect(result.current.error).toMatch(/niet gelukt/i);
  });

  it.each([
    [422, /concretere antwoorden/],
    [500, /niet gelukt/],
    [503, /niet beschikbaar/],
    [404, /verlopen/],
  ])('shows a Dutch message for a %d problem response from the poll', async (status, message) => {
    vi.mocked(descriptionApi.generateDescription).mockResolvedValue({
      generationId: 'gen-1',
      status: 'PENDING',
    });
    vi.mocked(descriptionApi.getGenerationStatus).mockRejectedValue({
      title: 'Description generation failed',
      status,
      detail: 'English detail meant for developers',
    });

    const { result } = renderHook(() => useGenerateVacancyDescription('vacancy-1'));

    act(() => {
      result.current.start(inputs);
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await waitFor(() => expect(result.current.phase).toBe('failed'));
    expect(result.current.error).toMatch(message);
    expect(result.current.error).not.toMatch(/English/);
  });

  it('regenerate(section) re-runs generation and only replaces the requested section', async () => {
    vi.mocked(descriptionApi.generateDescription).mockResolvedValue({
      generationId: 'gen-1',
      status: 'PENDING',
    });
    vi.mocked(descriptionApi.getGenerationStatus).mockResolvedValue({
      generationId: 'gen-1',
      status: 'COMPLETED',
      description: { summary: 'First summary', jobDescription: 'First role text', tasks: 'First tasks' },
    });

    const { result } = renderHook(() => useGenerateVacancyDescription('vacancy-1'));

    act(() => {
      result.current.start(inputs);
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await waitFor(() => expect(result.current.phase).toBe('ready'));

    vi.mocked(descriptionApi.getGenerationStatus).mockResolvedValue({
      generationId: 'gen-2',
      status: 'COMPLETED',
      description: { summary: 'Second summary', jobDescription: 'Second role text', tasks: 'Second tasks' },
    });

    await act(async () => {
      await result.current.regenerate('summary');
      await vi.runAllTimersAsync();
    });

    await waitFor(() =>
      expect(result.current.result).toEqual({
        summary: 'Second summary',
        jobDescription: 'First role text',
        tasks: 'First tasks',
      }),
    );
  });
});
