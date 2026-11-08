import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient, type ApiError } from './http-client';

function jsonResponse(status: number, body: unknown, contentType = 'application/json') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null) },
    json: async () => body,
  };
}

describe('httpClient', () => {
  beforeEach(async () => {
    const { loadRuntimeConfig } = await import('../config/runtime-config');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(jsonResponse(200, { apiBaseUrl: 'http://localhost:8080' })),
    );
    await loadRuntimeConfig();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves with the parsed JSON body on a successful GET', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse(200, { id: '1' })));

    const result = await httpClient.get<{ id: string }>('/vacancy/1');

    expect(result).toEqual({ id: '1' });
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('http://localhost:8080/vacancy/1');
  });

  it('sends a JSON body on POST', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse(201, { id: '1' })));

    await httpClient.post('/vacancy', { jobTitle: 'Dev' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ jobTitle: 'Dev' }));
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('sends a plain JSON body on PATCH, which is the only type the API accepts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse(200, { id: '1' })));

    await httpClient.patch('/vacancy/1', { jobTitle: 'Dev' });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe('PATCH');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it.each([400, 401, 403, 404, 409, 422, 500, 501, 503])(
    'parses a %d application/problem+json response into an ApiError',
    async (status) => {
      const problem = { title: 'Something went wrong', status, detail: 'Details here' };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce(jsonResponse(status, problem, 'application/problem+json')),
      );

      let caught: ApiError | undefined;
      try {
        await httpClient.get('/vacancy/1');
      } catch (error) {
        caught = error as ApiError;
      }

      expect(caught).toBeDefined();
      expect(caught?.status).toBe(status);
      expect(caught?.title).toBe('Something went wrong');
      expect(caught?.detail).toBe('Details here');
    },
  );

  it('parses field-level errors from a 400 ProblemDetails response', async () => {
    const problem = {
      title: 'Validation failed',
      status: 400,
      errors: [{ field: 'jobTitle', message: 'is required' }],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(jsonResponse(400, problem, 'application/problem+json')),
    );

    let caught: ApiError | undefined;
    try {
      await httpClient.post('/vacancy', {});
    } catch (error) {
      caught = error as ApiError;
    }

    expect(caught?.errors).toEqual([{ field: 'jobTitle', message: 'is required' }]);
  });

  it('maps a network failure to a synthetic ApiError with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')));

    let caught: ApiError | undefined;
    try {
      await httpClient.get('/vacancy/1');
    } catch (error) {
      caught = error as ApiError;
    }

    expect(caught).toBeDefined();
    expect(caught?.status).toBe(0);
    expect(caught?.title).toBeTruthy();
  });
});
