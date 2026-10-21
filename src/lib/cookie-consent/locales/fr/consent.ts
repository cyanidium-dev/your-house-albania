import type { ConsentCopy } from "../en/consent";

export const consentCopyFr: ConsentCopy = {
  banner: {
    title: "Nous respectons votre vie privée",
    body: "Nous utilisons des cookies de mesure d'audience et de marketing pour améliorer le site. Les cookies nécessaires sont toujours actifs.",
    policyLead: "En savoir plus dans la",
    policyLinkLabel: "politique de confidentialité",
    accept: "Tout accepter",
    reject: "Tout refuser",
    customise: "Personnaliser",
  },
  preferences: {
    title: "Paramètres des cookies",
    sub: "Choisissez les cookies que nous pouvons utiliser. Vous pouvez modifier votre choix à tout moment via « Paramètres des cookies » en bas de page.",
    save: "Enregistrer mon choix",
    acceptAll: "Tout accepter",
    rejectAll: "Tout refuser",
    close: "Fermer",
    alwaysOn: "Toujours actifs",
    categories: {
      necessary: {
        label: "Nécessaires",
        description:
          "Indispensables au fonctionnement du site : ils enregistrent ce consentement et assurent la sécurité. Ils ne peuvent pas être désactivés.",
      },
      functional: {
        label: "Fonctionnels",
        description: "Enregistrent vos préférences, par exemple l'affichage de l'interface.",
      },
      analytics: {
        label: "Mesure d'audience",
        description:
          "Google Analytics et Microsoft Clarity : des statistiques de visite anonymes qui nous aident à améliorer le site.",
      },
      marketing: {
        label: "Marketing",
        description:
          "Publicité et remarketing (par exemple Google Ads) : mesurer l'efficacité des campagnes.",
      },
    },
  },
  settingsLink: "Paramètres des cookies",
};
