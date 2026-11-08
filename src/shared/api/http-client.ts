import { getRuntimeConfig } from '../config/runtime-config';

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: ApiErrorDetail[];
}

/** Auth is out of scope for issue #4 — seam left for when a real login flow lands. */
function getAuthToken(): string | null {
  return null;
}

function buildHeaders(contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function toApiError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/problem+json')) {
    try {
      const body = (await response.json()) as Partial<ApiError>;
      return {
        type: body.type,
        title: body.title ?? 'Er is een fout opgetreden.',
        status: body.status ?? response.status,
        detail: body.detail,
        instance: body.instance,
        errors: body.errors,
      };
    } catch {
      // fall through to the generic mapping below
    }
  }
  return { title: `Onverwachte fout (status ${response.status}).`, status: response.status };
}

async function request<TResponse>(
  path: string,
  init: { method: string; body?: unknown },
): Promise<TResponse> {
  const { apiBaseUrl } = getRuntimeConfig();
  const url = `${apiBaseUrl}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method,
      headers: buildHeaders(init.body !== undefined ? 'application/json' : undefined),
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch (cause) {
    const networkError: ApiError = {
      title: 'Netwerkfout: de server is niet bereikbaar.',
      status: 0,
      detail: cause instanceof Error ? cause.message : undefined,
    };
    throw networkError;
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export const httpClient = {
  get<TResponse>(path: string): Promise<TResponse> {
    return request<TResponse>(path, { method: 'GET' });
  },
  post<TResponse>(path: string, body: unknown): Promise<TResponse> {
    return request<TResponse>(path, { method: 'POST', body });
  },
  patch<TResponse>(path: string, body: unknown): Promise<TResponse> {
    return request<TResponse>(path, { method: 'PATCH', body });
  },
  delete<TResponse>(path: string): Promise<TResponse> {
    return request<TResponse>(path, { method: 'DELETE' });
  },
};
