import type { ConsentCopy } from "../en/consent";

export const consentCopyUk: ConsentCopy = {
  banner: {
    title: "Ми поважаємо вашу приватність",
    body: "Використовуємо cookies для аналітики та маркетингу, щоб покращувати сайт. Необхідні cookies працюють завжди.",
    policyLead: "Деталі — у",
    policyLinkLabel: "Політиці конфіденційності",
    accept: "Прийняти всі",
    reject: "Відхилити всі",
    customise: "Налаштувати",
  },
  preferences: {
    title: "Налаштування cookies",
    sub: "Оберіть, які cookies ми можемо використовувати. Змінити вибір можна будь-коли через «Налаштування cookies» у футері.",
    save: "Зберегти вибір",
    acceptAll: "Прийняти всі",
    rejectAll: "Відхилити всі",
    close: "Закрити",
    alwaysOn: "Завжди увімкнено",
    categories: {
      necessary: {
        label: "Необхідні",
        description:
          "Потрібні для роботи сайту: зберігають ваш вибір щодо cookies і забезпечують безпеку. Вимкнути неможливо.",
      },
      functional: {
        label: "Функціональні",
        description: "Запам'ятовують ваші налаштування, як-от персоналізацію інтерфейсу.",
      },
      analytics: {
        label: "Аналітичні",
        description:
          "Google Analytics і Microsoft Clarity — анонімна статистика відвідувань, що допомагає покращувати сайт.",
      },
      marketing: {
        label: "Маркетингові",
        description:
          "Реклама та ремаркетинг (напр. Google Ads) — вимірюють ефективність кампаній.",
      },
    },
  },
  settingsLink: "Налаштування cookies",
};
