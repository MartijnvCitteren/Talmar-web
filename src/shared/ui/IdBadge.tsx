import { UserRound } from 'lucide-react';
import styles from './IdBadge.module.css';

export interface IdBadgeField {
  label: string;
  /** Shown in place of a value that isn't known yet. */
  placeholder: string;
  value?: string;
}

export interface IdBadgeProps {
  /** The person's name; while unknown, `namePlaceholder` is shown as a blank to fill. */
  name?: string;
  namePlaceholder: string;
  /** Shown instead when the name can't be known here: plain text, no initials, not a blank. */
  heading?: string;
  /** The line under the name, e.g. the company. */
  organisation?: string;
  /** Without a placeholder, the line is left out until there is an organisation. */
  organisationPlaceholder?: string;
  fields: IdBadgeField[];
  /** Status with the design system's shape: passed = circle, attention = square. */
  status?: { tone: 'passed' | 'attention'; label: string };
  /** Accessible name of the whole badge, e.g. "Voorbeeld van je account". */
  label: string;
}

/**
 * A staff ID badge on a lanyard that fills in as someone signs up: name, company, e-mail,
 * role. Purely a preview of what the form will create; it holds no state of its own.
 * Hangs off the top of its container, so give that container `overflow: hidden`.
 */
export function IdBadge({
  name,
  namePlaceholder,
  heading,
  organisation,
  organisationPlaceholder,
  fields,
  status,
  label,
}: IdBadgeProps) {
  const initials = toInitials(name);

  return (
    <figure className={styles.hanger} aria-label={label}>
      <div className={styles.badge}>
        <span className={styles.slot} aria-hidden="true" />
        <span className={styles.avatar} aria-hidden="true">
          {initials ?? <UserRound size={28} />}
        </span>
        <p className={styles.name} data-empty={!name && !heading}>
          {name || heading || namePlaceholder}
        </p>
        {(organisation || organisationPlaceholder) && (
          <p className={styles.organisation} data-empty={!organisation}>
            {organisation || organisationPlaceholder}
          </p>
        )}
        <dl className={styles.fields}>
          {fields.map((field) => (
            <div key={field.label} className={styles.field}>
              <dt className={styles.fieldLabel}>{field.label}</dt>
              <dd className={styles.fieldValue} data-empty={!field.value}>
                {field.value || field.placeholder}
              </dd>
            </div>
          ))}
        </dl>
        {status && (
          <p className={styles.status} data-tone={status.tone}>
            <span className={styles.shape} aria-hidden="true" />
            {status.label}
          </p>
        )}
      </div>
    </figure>
  );
}

function toInitials(name: string | undefined): string | undefined {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return undefined;
  }
  // "Sanne de Vries" → "SV": first and last word, so Dutch prefixes ("de", "van") don't count.
  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : '';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
