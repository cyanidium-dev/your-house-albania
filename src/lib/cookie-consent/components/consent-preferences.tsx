"use client";

import { useEffect, useState } from "react";
import { CATEGORY_GCM_SIGNALS } from "../config";
import type { ConsentCopy } from "../locales";
import type { ConsentChoices, TogglableCategory } from "../types";
import {
  alwaysOnClass,
  categoryDescClass,
  categoryLabelClass,
  categoryRowClass,
  dialogFooterClass,
  dialogSubClass,
  dialogTitleClass,
} from "../styles/classes";
import { ConsentButton } from "./primitives/consent-button";
import { ConsentDialog } from "./primitives/consent-dialog";
import { ConsentSwitch } from "./primitives/consent-switch";

// Derived from config so a new category automatically appears in the UI.
const TOGGLABLE = Object.keys(CATEGORY_GCM_SIGNALS) as TogglableCategory[];

type Props = {
  open: boolean;
  copy: ConsentCopy;
  initialChoices: ConsentChoices;
  onSave: (choices: ConsentChoices) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose: () => void;
};

export function ConsentPreferences({
  open,
  copy,
  initialChoices,
  onSave,
  onAcceptAll,
  onRejectAll,
  onClose,
}: Props) {
  const [choices, setChoices] = useState<ConsentChoices>(initialChoices);

  // Re-sync draft state each time the dialog opens.
  useEffect(() => {
    if (open) setChoices(initialChoices);
  }, [open, initialChoices]);

  return (
    <ConsentDialog open={open} onClose={onClose} labelledBy="consent-prefs-title">
      <h2 id="consent-prefs-title" className={dialogTitleClass}>
        {copy.preferences.title}
      </h2>
      <p className={dialogSubClass}>{copy.preferences.sub}</p>

      <div className="mt-5">
        <div className={categoryRowClass}>
          <div>
            <p id="consent-cat-necessary" className={categoryLabelClass}>
              {copy.preferences.categories.necessary.label}
            </p>
            <p className={categoryDescClass}>
              {copy.preferences.categories.necessary.description}
            </p>
          </div>
          <span className={alwaysOnClass}>{copy.preferences.alwaysOn}</span>
        </div>

        {TOGGLABLE.map((category) => (
          <div key={category} className={categoryRowClass}>
            <div>
              <p id={`consent-cat-${category}`} className={categoryLabelClass}>
                {copy.preferences.categories[category].label}
              </p>
              <p className={categoryDescClass}>
                {copy.preferences.categories[category].description}
              </p>
            </div>
            <ConsentSwitch
              checked={choices[category]}
              labelledBy={`consent-cat-${category}`}
              onChange={(next) => setChoices((prev) => ({ ...prev, [category]: next }))}
            />
          </div>
        ))}
      </div>

      <div className={dialogFooterClass}>
        <ConsentButton variant="ghost" onClick={onRejectAll}>
          {copy.preferences.rejectAll}
        </ConsentButton>
        <ConsentButton variant="secondary" onClick={onAcceptAll}>
          {copy.preferences.acceptAll}
        </ConsentButton>
        <ConsentButton variant="primary" onClick={() => onSave(choices)}>
          {copy.preferences.save}
        </ConsentButton>
      </div>
    </ConsentDialog>
  );
}
