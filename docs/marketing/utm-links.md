# UTM-ссылки для своих каналов (трек C4)

52 % лидов в октябре 2026 пришли «ниоткуда» (direct): это переходы из Telegram-канала, Instagram, Threads, WhatsApp-статусов и рассылок, у которых нет метки. Сайт читает `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` (`src/lib/analytics/attribution.ts`) и кладёт канал в каждый лид (`channel` в документе lead) и в GA4/Clarity. Правило простое: **любая ссылка на domlivo.com, которую мы ставим сами, несёт метку**. Без метки - только ссылки, которые ставят другие.

Какой `utm_medium` во что превращается на сайте (`src/lib/analytics/trafficSource.ts`): `social` → канал Social; `email` или `newsletter` → Email; `referral` → Referral; всё остальное → Campaign. `utm_source` - имя площадки, `utm_campaign` - что именно (bio, пост, выпуск индекса), `utm_content` - вариант (кнопка, сторис).

## Постоянные ссылки (поставить один раз)

| Где | Ссылка |
|---|---|
| Instagram, био | `https://www.domlivo.com/ru/?utm_source=instagram&utm_medium=social&utm_campaign=bio` |
| Instagram, ссылка в сторис на объект | `https://www.domlivo.com/ru/property/<slug>?utm_source=instagram&utm_medium=social&utm_campaign=story&utm_content=<дата>` |
| Threads, профиль | `https://www.domlivo.com/ru/?utm_source=threads&utm_medium=social&utm_campaign=bio` |
| Telegram-канал, описание | `https://www.domlivo.com/ru/?utm_source=telegram&utm_medium=social&utm_campaign=channel-about` |
| Telegram-канал, пост с объектом | `https://www.domlivo.com/ru/property/<slug>?utm_source=telegram&utm_medium=social&utm_campaign=channel-post` |
| Telegram-канал, выпуск индекса | `https://www.domlivo.com/ru/blog/durres-asking-price-index-<ГГГГ-ММ>?utm_source=telegram&utm_medium=social&utm_campaign=price-index` |
| WhatsApp-статус / подпись | `https://www.domlivo.com/ru/?utm_source=whatsapp&utm_medium=social&utm_campaign=status` |
| Facebook-страница, кнопка | `https://www.domlivo.com/ru/?utm_source=facebook&utm_medium=social&utm_campaign=page-button` |
| YouTube, описание видео | `https://www.domlivo.com/ru/?utm_source=youtube&utm_medium=social&utm_campaign=video&utm_content=<ролик>` |
| Подпись в e-mail | `https://www.domlivo.com/en/?utm_source=signature&utm_medium=email&utm_campaign=signature` |
| Рассылка (когда появится) | `...?utm_source=newsletter&utm_medium=email&utm_campaign=<выпуск>` |
| Партнёр Cactus, ссылка с их сайта | без метки - это честная внешняя ссылка; её видно по referrer |

Язык в ссылке - язык аудитории канала (`/ru/`, `/uk/`, `/de/`…). Бот уже ставит метки сам (`utm_source=telegram&utm_medium=bot`).

## Что потом смотреть

В Studio → Leads: поле Source/Medium/Campaign у каждого лида. В чекапе (`/domlivo-checkup`) - доля direct должна падать с 52 % ниже 25 % за два месяца; если нет, значит где-то осталась ссылка без метки.
