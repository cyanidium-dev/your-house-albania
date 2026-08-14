export const consentCopyEn = {
  banner: {
    title: "We value your privacy",
    body: "We use cookies for analytics and marketing to improve the site. Necessary cookies are always on.",
    policyLead: "See our",
    policyLinkLabel: "Privacy Policy",
    accept: "Accept all",
    reject: "Reject all",
    customise: "Customise",
  },
  preferences: {
    title: "Cookie preferences",
    sub: "Choose which cookies we may use. You can change this any time via “Cookie settings” in the footer.",
    save: "Save choices",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    close: "Close",
    alwaysOn: "Always on",
    categories: {
      necessary: {
        label: "Necessary",
        description:
          "Required for the site to work: remembering this consent choice and keeping the site secure. Cannot be switched off.",
      },
      functional: {
        label: "Functional",
        description: "Remember your preferences, such as interface personalisation.",
      },
      analytics: {
        label: "Analytics",
        description:
          "Google Analytics and Microsoft Clarity — anonymous visit statistics that help us improve the site.",
      },
      marketing: {
        label: "Marketing",
        description:
          "Advertising and remarketing (e.g. Google Ads) — measure campaign performance.",
      },
    },
  },
  settingsLink: "Cookie settings",
} as const;

export type ConsentCopy = {
  banner: {
    title: string;
    body: string;
    /** Lead-in of the policy sentence ("See our") — rendered on its own line on desktop. */
    policyLead: string;
    policyLinkLabel: string;
    accept: string;
    reject: string;
    customise: string;
  };
  preferences: {
    title: string;
    sub: string;
    save: string;
    acceptAll: string;
    rejectAll: string;
    close: string;
    alwaysOn: string;
    categories: Record<
      "necessary" | "functional" | "analytics" | "marketing",
      { label: string; description: string }
    >;
  };
  settingsLink: string;
};
