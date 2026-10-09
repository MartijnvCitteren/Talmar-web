import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './fields.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

/** A non-selectable divider between groups of options — never becomes the field's value. */
export interface SelectSeparator {
  type: 'separator';
}

export type SelectItem = SelectOption | SelectSeparator;

const SEPARATOR_TEXT = '─'.repeat(24);

function isSeparator(item: SelectItem): item is SelectSeparator {
  return 'type' in item && item.type === 'separator';
}

export interface SelectProps {
  label: string;
  options: SelectItem[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Short mono badge (e.g. an ISO2 country code) shown between the control text and the chevron. */
  suffix?: string;
  autoFocus?: boolean;
}

export function Select({
  label,
  options,
  value,
  onChange,
  error,
  placeholder,
  disabled,
  suffix,
  autoFocus,
}: SelectProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.controlWrapper}>
        <select
          id={id}
          className={`${styles.control}${suffix ? ` ${styles.controlWithSuffix}` : ''}`}
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, index) =>
            isSeparator(option) ? (
              <option key={`separator-${index}`} disabled>
                {SEPARATOR_TEXT}
              </option>
            ) : (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
        </select>
        {suffix && (
          <span className={styles.suffix} aria-hidden="true">
            {suffix}
          </span>
        )}
        <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
