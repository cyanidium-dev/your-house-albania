"use client";

import {
  switchThumbCheckedClass,
  switchThumbClass,
  switchTrackClass,
} from "../../styles/classes";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** id of the visible label element. */
  labelledBy: string;
};

export function ConsentSwitch({ checked, onChange, disabled, labelledBy }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={switchTrackClass}
    >
      <span
        aria-hidden="true"
        className={`${switchThumbClass}${checked ? ` ${switchThumbCheckedClass}` : ""}`}
      />
    </button>
  );
}
