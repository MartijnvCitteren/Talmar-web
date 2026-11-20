import type { ApiErrorDetail } from '../api/http-client';

export const DEFAULT_FIELD_ERROR = 'Deze waarde klopt nog niet. Kijk het veld even na.';

/**
 * Turns the API's `errors` extension member into a field-keyed message map for a form.
 *
 * The API names a field by its path in the request body (`location.city`,
 * `contactPerson.email`, `offer.salaryMin`), while a form keys its errors by the field's own
 * name, so only the last path segment is kept. The API's messages are English and meant for
 * developers; the form passes Dutch messages per field instead, and any field without one gets
 * a calm generic message.
 */
export function toFieldErrors(
  errors: ApiErrorDetail[] | undefined,
  messages: Record<string, string> = {},
): Record<string, string> {
  if (!errors) {
    return {};
  }
  return errors.reduce<Record<string, string>>((acc, { field }) => {
    const key = field.split('.').pop() ?? field;
    acc[key] = messages[key] ?? DEFAULT_FIELD_ERROR;
    return acc;
  }, {});
}

export interface UserMessageOptions {
  /** Shown for any status without a more specific message below. */
  fallback: string;
  /** Overrides per HTTP status, for statuses whose meaning differs per operation. */
  byStatus?: Record<number, string>;
}

const commonMessages: Record<number, string> = {
  0: 'We kunnen de server nu niet bereiken. Controleer je verbinding en probeer het zo nog eens.',
  404: 'Deze vacature bestaat niet (meer). Begin een nieuwe vacature.',
  409: 'Deze vacature is net ergens anders aangepast. Laad de pagina opnieuw en probeer het nog eens.',
  501: 'Dit onderdeel is nog niet beschikbaar. Je concept is wel bewaard.',
};

/**
 * A calm Dutch message for a failed API call. The API's `title` and `detail` are English and
 * meant for developers, so they are never shown as-is (voice & tone: no raw codes or jargon).
 */
export function toUserMessage(error: { status?: number } | undefined, options: UserMessageOptions): string {
  const status = error?.status;
  if (status === undefined) {
    return options.fallback;
  }
  return options.byStatus?.[status] ?? commonMessages[status] ?? options.fallback;
}
