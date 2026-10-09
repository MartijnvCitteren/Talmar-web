import { useId } from 'react';
import styles from './fields.module.css';

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** Bolds this field's label — scoped opt-in for callers like the 3-questions modal (design README's "weight 600" spec), not a global label-weight change. */
  boldLabel?: boolean;
  /** Visually hides the label (sr-only) while keeping it as the accessible name — for callers like review-vacancy's per-section edit mode, where a visible section header already serves as the label. */
  hideLabel?: boolean;
  /** Single-line only; ignored for `multiline`. */
  type?: 'text' | 'email';
  autoComplete?: string;
  autoFocus?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  error,
  placeholder,
  maxLength,
  multiline,
  disabled,
  helperText,
  boldLabel,
  hideLabel,
  type,
  autoComplete,
  autoFocus,
}: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? helperText;
  const Element = multiline ? 'textarea' : 'input';
  const labelClassName = [styles.label, boldLabel && styles.labelBold, hideLabel && styles.srOnly]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <Element
        id={id}
        className={styles.control}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        type={multiline ? undefined : type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {helperText && !error && (
        <p id={messageId} className={styles.label}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={messageId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
