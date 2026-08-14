"use client";

import type { ButtonHTMLAttributes } from "react";
import {
  buttonBaseClass,
  buttonGhostClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "../../styles/classes";

const VARIANT_CLASS = {
  primary: buttonPrimaryClass,
  secondary: buttonSecondaryClass,
  ghost: buttonGhostClass,
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANT_CLASS;
};

export function ConsentButton({ variant = "secondary", className, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`${buttonBaseClass} ${VARIANT_CLASS[variant]}${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}
