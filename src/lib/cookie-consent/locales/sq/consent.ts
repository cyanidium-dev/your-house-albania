import type { ConsentCopy } from "../en/consent";

export const consentCopySq: ConsentCopy = {
  banner: {
    title: "Ne respektojmë privatësinë tuaj",
    body: "Përdorim cookies për analitikë dhe marketing për të përmirësuar faqen. Cookies e nevojshme janë gjithmonë aktive.",
    policyLead: "Shihni",
    policyLinkLabel: "Politikën e Privatësisë",
    accept: "Prano të gjitha",
    reject: "Refuzo të gjitha",
    customise: "Personalizo",
  },
  preferences: {
    title: "Preferencat e cookies",
    sub: "Zgjidhni cilat cookies mund të përdorim. Mund ta ndryshoni zgjedhjen në çdo kohë përmes «Cilësimet e cookies» në fund të faqes.",
    save: "Ruaj zgjedhjet",
    acceptAll: "Prano të gjitha",
    rejectAll: "Refuzo të gjitha",
    close: "Mbyll",
    alwaysOn: "Gjithmonë aktive",
    categories: {
      necessary: {
        label: "Të nevojshme",
        description:
          "Të domosdoshme për funksionimin e faqes: ruajnë zgjedhjen tuaj të pëlqimit dhe sigurojnë faqen. Nuk mund të çaktivizohen.",
      },
      functional: {
        label: "Funksionale",
        description: "Ruajnë preferencat tuaja, si personalizimi i ndërfaqes.",
      },
      analytics: {
        label: "Analitike",
        description:
          "Google Analytics dhe Microsoft Clarity — statistika anonime vizitash që na ndihmojnë të përmirësojmë faqen.",
      },
      marketing: {
        label: "Marketing",
        description:
          "Reklamim dhe rimarketing (p.sh. Google Ads) — matin efektivitetin e fushatave.",
      },
    },
  },
  settingsLink: "Cilësimet e cookies",
};
