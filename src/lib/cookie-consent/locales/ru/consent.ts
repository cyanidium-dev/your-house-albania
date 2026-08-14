import type { ConsentCopy } from "../en/consent";

export const consentCopyRu: ConsentCopy = {
  banner: {
    title: "Мы уважаем вашу приватность",
    body: "Используем cookies для аналитики и маркетинга, чтобы улучшать сайт. Необходимые cookies работают всегда.",
    policyLead: "Детали — в",
    policyLinkLabel: "Политике конфиденциальности",
    accept: "Принять все",
    reject: "Отклонить все",
    customise: "Настроить",
  },
  preferences: {
    title: "Настройки cookies",
    sub: "Выберите, какие cookies мы можем использовать. Изменить выбор можно в любой момент через «Настройки cookies» в футере.",
    save: "Сохранить выбор",
    acceptAll: "Принять все",
    rejectAll: "Отклонить все",
    close: "Закрыть",
    alwaysOn: "Всегда включено",
    categories: {
      necessary: {
        label: "Необходимые",
        description:
          "Нужны для работы сайта: сохраняют ваш выбор насчёт cookies и обеспечивают безопасность. Отключить невозможно.",
      },
      functional: {
        label: "Функциональные",
        description: "Запоминают ваши настройки, например персонализацию интерфейса.",
      },
      analytics: {
        label: "Аналитические",
        description:
          "Google Analytics и Microsoft Clarity — анонимная статистика посещений, помогающая улучшать сайт.",
      },
      marketing: {
        label: "Маркетинговые",
        description:
          "Реклама и ремаркетинг (напр. Google Ads) — измеряют эффективность кампаний.",
      },
    },
  },
  settingsLink: "Настройки cookies",
};
