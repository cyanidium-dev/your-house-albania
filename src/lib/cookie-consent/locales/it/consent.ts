import type { ConsentCopy } from "../en/consent";

export const consentCopyIt: ConsentCopy = {
  banner: {
    title: "Rispettiamo la tua privacy",
    body: "Usiamo i cookie per analisi e marketing per migliorare il sito. I cookie necessari sono sempre attivi.",
    policyLead: "Consulta la",
    policyLinkLabel: "Privacy Policy",
    accept: "Accetta tutti",
    reject: "Rifiuta tutti",
    customise: "Personalizza",
  },
  preferences: {
    title: "Preferenze cookie",
    sub: "Scegli quali cookie possiamo usare. Puoi cambiare la scelta in qualsiasi momento tramite «Impostazioni cookie» nel footer.",
    save: "Salva le scelte",
    acceptAll: "Accetta tutti",
    rejectAll: "Rifiuta tutti",
    close: "Chiudi",
    alwaysOn: "Sempre attivi",
    categories: {
      necessary: {
        label: "Necessari",
        description:
          "Indispensabili per il funzionamento del sito: ricordano questa scelta di consenso e garantiscono la sicurezza. Non possono essere disattivati.",
      },
      functional: {
        label: "Funzionali",
        description: "Ricordano le tue preferenze, come la personalizzazione dell'interfaccia.",
      },
      analytics: {
        label: "Analitici",
        description:
          "Google Analytics e Microsoft Clarity — statistiche anonime delle visite che ci aiutano a migliorare il sito.",
      },
      marketing: {
        label: "Marketing",
        description:
          "Pubblicità e remarketing (es. Google Ads) — misurano l'efficacia delle campagne.",
      },
    },
  },
  settingsLink: "Impostazioni cookie",
};
