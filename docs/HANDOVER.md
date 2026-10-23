# Domlivo как код: что привязано к нам, а что нет

Реестр для продажи или копирования Domlivo как кода. Он отвечает на один вопрос: **что нужно поменять, чтобы другой человек взял два репозитория, свою Sanity и свой Vercel и получил рабочий портал со своим брендом и своими данными.** Здесь нет рефакторинга, только карта. Внизу - инструкция для ИИ-модели, которая будет это делать.

Правило поддержки (есть и в CLAUDE.md): любая новая вещь, вшитая в код под Domlivo, Албанию или конкретного партнёра (бренд, домен, контакты, идентификаторы сервисов, списки городов/районов/страниц, тексты с географией), получает строку в этом файле **в том же PR**. Дата последней сверки: 2026-10-20.

Репозитории: фронтенд `cyanidium-dev/your-house-albania` (Next.js 15, App Router, next-intl, Vercel), админка `cyanidium-dev/domlivo-admin` (Sanity Studio, схемы, скрипты импорта). Данные и отчёты вне кода: папка `domlivo-workspace` и `reports/` у владельца, в коробку не входят.

## 1. Три слоя

| Слой | Что там | Меняется при продаже |
|---|---|---|
| **Env** (Vercel + `.env.local`) | секреты и идентификаторы внешних сервисов | всё, покупатель заводит своё |
| **Код** | бренд, география, списки страниц, партнёрские лендинги, аналитические id, тексты в `messages/*.json` | по таблице §3 |
| **Sanity** (project `g4aqp6ex`, dataset `production`) | объекты, города/районы, агенты, статьи, siteSettings, лиды | покупатель получает пустой датасет и схемы, наши данные не передаются |

## 2. Env: полный список переменных фронтенда

Источник: `grep -rhoE "process\.env\.[A-Z0-9_]+" src` и `.env.example`. Всё, что помечено «секрет», в коробку не входит.

| Переменная | Назначение | Где взять |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `SANITY_PROJECT_ID` | проект Sanity | sanity.io → проект |
| `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_DATASET` | датасет (`production`) | там же |
| `SANITY_API_VERSION` | версия API, не секрет | оставить |
| `SANITY_WRITE_TOKEN`, `SANITY_API_TOKEN` | секрет, запись лидов/счётчиков | Sanity → API → Tokens (Editor) |
| `SANITY_REVALIDATE_SECRET` | секрет вебхука `api/revalidate/sanity` | придумать, вписать в вебхук Sanity |
| `NEXT_PUBLIC_SITE_URL` | канонический домен (`https://www.domlivo.com`) | свой домен |
| `NEXT_PUBLIC_ENABLE_INDEXING` | `true` только на проде | - |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | включает GTM/GA4/Clarity/PostHog после согласия | - |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | PostHog EU (наш проект 312129) | свой проект PostHog |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_GENERAL_CHAT_ID`, `TELEGRAM_AGENT_CONTACT_CHAT_ID`, `TELEGRAM_API_BASE_URL`, `TELEGRAM_OWNER_CHAT_ID` (необяз.: личная воронка с 1 % по понедельникам) | внутренний бот лидов: куда падают заявки (запасной, когда публичный бот не может писать в чат) | свой бот через BotFather, свой чат |
| `TELEGRAM_PUBLIC_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | публичный бот для клиентов (наш @DomlivoAlbaniaBot); он же публикует заявки с кнопками статусов в чаты команды |  свой бот; вебхук ставится `scripts/telegram-set-webhook.ts` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | номер WhatsApp для кнопок | свой |
| `CRON_SECRET` | секрет крон-маршрутов (`api/cron/*`, `api/indexnow/*`) | придумать |
| `INDEXNOW_KEY` | ключ IndexNow (Bing/Yandex), отдаётся по `/<key>.txt` | сгенерировать |
| `FIXER_API_KEY` | курсы валют | fixer.io |
| `EDITOR_PASSWORD`, `EDITOR_SESSION_SECRET` | встроенный редактор лендингов `/editor` | придумать |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_WORKSPACE_ID`, `AI_MONTHLY_BUDGET_USD` | ИИ-поиск на сайте | свой ключ Anthropic |

Админка: `.env` с `SANITY_API_TOKEN` (секрет, для скриптов), `SANITY_PROJECT_ID`, `SANITY_DATASET`.

## 3. Захардкожено в коде (менять при продаже)

### 3.1 Идентификаторы и контакты

| Что | Где | Действие |
|---|---|---|
| GTM `GTM-T27ZZ289`, Clarity `x4l0dctgle` | `src/lib/analytics/config.ts` | заменить на свои или вынести в env |
| WhatsApp Business ссылка, Telegram-канал `t.me/real_estate_al` | `src/lib/contacts/businessContacts.ts` | свои |
| Команда (имена, роли, ссылки на профили, фото) | `src/lib/about/team.ts`, тексты в `messages/*.json` → `About`, JSON-LD в `src/lib/seo/teamPerson.ts`, `aboutJsonLd.ts` | переписать под нового владельца |
| Организация в JSON-LD (название, домен, соцсети, логотип) | `src/lib/seo/siteJsonLd.ts` | свои |
| Проект Sanity в админке | `domlivo-admin/sanity.config.ts`, `sanity.cli.ts` (`projectId: 'g4aqp6ex'`), 78 скриптов в `domlivo-admin/scripts/**` с тем же id по умолчанию (все читают `process.env.SANITY_PROJECT_ID` с фолбэком) | заменить id, фолбэк убрать |
| Ссылка на наш CDN в тесте | `src/lib/images/__tests__/loader.test.ts` | косметика |
| Деловая почта | `src/lib/contacts/businessEmail.ts` | своя |

### 3.2 Бренд и домен в коде

Файлы в `src/`, где встречается `domlivo` (без тестов), на 2026-10-20: 60. Группы:

- **Маршруты и страницы:** `app/[locale]/layout.tsx` (metadata, manifest), `about`, `methodology`, `privacy`, `terms`, `prices`, `catalog`, `ai-search`, `[country]/page.tsx`, `[country]/[city]/info/page.tsx`, `guides/[slug]`, `knowledge/[slug]`, `app/manifest.ts`, `app/api/og/route.tsx`, `app/llms.txt`, `app/llms-full.txt`, `app/data/prices/**` (открытые датасеты индекса цен с нашим именем).
- **Компоненты:** `components/pwa/*` (имя приложения), `components/contact/ContactPageContent.tsx`, `components/city/CityPriceAnswer.tsx`, `components/landing/sections/ListingPriceIndexSection.tsx`, `components/shared/property/PropertyOwnershipCostsSection.tsx`, `PropertyPriceHistorySection.tsx`, `components/catalog/**` (подписи «на Domlivo»), `components/analytics/LeadTracker.tsx`.
- **Библиотеки:** `lib/ai/prompt.ts` (системный промпт ИИ-поиска: бренд, страна, тон), `lib/ai/knowledgeTools.ts`, `lib/ai/unservedPlaces.ts`, `lib/cookie-consent/config.ts` (имя cookie, домен), `lib/guides/pdf/writer.ts` (PDF-гайд с брендом), `lib/analytics/attribution.ts` и `posthogServer.ts`, `lib/catalog/publicDealTypes.ts`, `lib/geo/parseMapsLink.ts`, `features/editor/*`.
- **Юридические тексты** `privacy`, `terms`: юрлицо, адрес, почта в `messages/*.json` → `Legal`.

Проверка актуальности списка: `grep -rliE "domlivo" src --include=*.ts --include=*.tsx | grep -v __tests__`.

### 3.3 География и списки страниц в коде

| Что | Где | Комментарий |
|---|---|---|
| Страна по умолчанию, города, районы и их слаги для SEO-страниц, фасеты, политика индексации | `src/lib/seo/pages/registry.ts`, `policy.ts`, `eligibility.ts`, `decide.ts`, `links.ts`, `data/keywordEvidence.ts` (наши данные спроса из Keyword Planner), `data/experiments.ts` | основа каталога; у покупателя своя страна и города |
| Немецкий хаб `/de/albanien-immobilien`: только локаль de, список городов для лида (Дуррес, Тирана, Влёра, Саранда), слаги 5 немецких статей и 2 статей для FAQ, ссылка на DE-лендинг «am Meer» | `src/lib/germanHub/config.ts` (+ `facts.ts`, `load.ts`), запрос `lib/sanity/queries/germanHub.ts`, маршрут `app/[locale]/albanien-immobilien`, компоненты `components/germanHub/*`, ссылки из футера (`FOOTER_MARKET_HUB` в `data/footerNavConfig.ts`) и с хиро `/de/sale` (`NonGeoDealListingPage.tsx`), sitemap через `STATIC_CODE_PAGES` (поле `locales`), `llms.txt`, тексты `messages/de.json` → `GermanHub`, `Footer.nav.germanHub` | гипотеза SEO 3 (19.10.2026); FAQ повторяет факты из немецких статей (налоги, нотариус, сроки, цены) - при продаже удалить или переписать под рынок покупателя |
| SEO-лаборатория, эксперимент E02 (21.10.2026): ссылки со статей, гайдов и /info с кликами на коммерческие страницы на позициях 10-35 (половина пар по жребию, вторая половина - контроль) | `src/lib/seoLab/internalLinks.ts` (карта источник → ссылки с анкорами на 5 языках), `components/seoLab/SeoLabLinks.tsx` в `blog/[slug]`, `guides/[slug]`, `[country]/[city]/info`, тексты `messages/*.json` → `SeoLab` | данные эксперимента Domlivo; после разбора 18.11.2026 либо оставить как постоянные ссылки, либо удалить вместе с компонентом; при продаже удалить |
| Немецкая посадочная «Haus am Meer» `/de/haus-am-meer-albanien-kaufen`: только локаль de, типы дом/вилла, порог «у моря» 1 км, 12 карточек, строка таблицы от 2 домов | `src/lib/seaHouses/config.ts` (+ `facts.ts`, `load.ts`), запрос `lib/sanity/queries/seaHouses.ts`, маршрут `app/[locale]/haus-am-meer-albanien-kaufen`, компонент `components/seaHouses/SeaHousesView.tsx`, ссылка из немецкого хаба (`GermanHubView.tsx`, блок «am Meer»), sitemap через `STATIC_CODE_PAGES` (поле `locales`), `llms.txt`, тексты `messages/de.json` → `SeaHouses`, `GermanHub.sea.houses` | план длинного хвоста F2 (24.10.2026): кластер GSC «haus am meer kaufen albanien», 174 показа без кликов; при продаже удалить или переписать под рынок покупателя |
| Хаб Шенгьина `/{locale}/shengjin`: все 8 локалей, город и страна, список городов для сравнения (Шенгьин, Дуррес, Влёра, Саранда, Тирана), пороги бюджета (50/80/100 тыс. €), 4 фасета для ссылок, слаги 2 гайдов-сравнений | `src/lib/shengjinHub/config.ts` (+ `facts.ts`, `load.ts`), запрос `lib/sanity/queries/shengjinHub.ts`, маршрут `app/[locale]/shengjin`, компоненты `components/shengjinHub/*`, ссылки из футера (`FOOTER_PLACE_HUB` в `data/footerNavConfig.ts`) и со страниц объектов Шенгьина (`ListingPlaceLinks.tsx`), sitemap через `STATIC_CODE_PAGES`, белый список fr в `lib/seo/localeIndexing.ts`, `llms.txt`, тексты `messages/*.json` → `ShengjinHub`, `Footer.nav.shengjinHub`; в реестре кластер `shengjin-apartments` открыт на 7 локалях и 4 фасета Шенгьина как эксперименты до 26.11.2026 (`seo/pages/data/experiments.ts`) | лендинг «дешёвая квартира у моря в Албании» на данных индекса (22.10.2026); при продаже удалить или переписать под город покупателя |
| Партнёрские лендинги Cactus: 8 страниц, район/комплекс, порог 5 квартир, список комплексов | `src/lib/partnerLandings/config.ts` (+ `facts.ts`, `copy.ts`, `load.ts`), маршрут `app/[locale]/partners/cactus/[slug]`, ссылки из `GeoListingRoute.tsx` и `ListingPlaceLinks.tsx`, sitemap `lib/seo/partnerLandingPages.ts`, тексты `messages/*.json` → `PartnerLanding` | живут в коде, потому что датасет Sanity на лимите 2026/2000 атрибутов; при продаже удалить или переписать под партнёра покупателя |
| Агентство по умолчанию для заявок: все заявки, кроме объектов агентств со своей группой (Cactus), идут в общий чат и в группу Grinchenko Real Estate (`real-estate-al`, Виктор); Cactus получает только свои | `src/lib/notifications/leads/leadRecipients.ts` → `DEFAULT_LEAD_AGENT_SLUG`, `leadAudience`; группа агентства = `agent.telegramLeadChatId` в Sanity | слаг агентства покупателя или пустая строка |
| Партнёры первыми в каталоге: Grinchenko (`real-estate-al`, все объекты) и лучшая четверть Cactus (`cactus`, до 40) перед общей ротацией, оценка качества объекта | `src/lib/catalog/rotation.ts` → `FEATURED_AGENCIES`, `qualityScore` | слаги агентов покупателя или пустой список |
| Статические код-страницы (`/prices`, `/methodology`, `/for-realtors`, `/how-to-publish`, `/investment`, `/luxury-villa`, `/office-spaces`, `/residential-homes`, `/image-credits`) | `src/lib/seo/staticCodePages.ts`, `src/app/[locale]/*` | тексты в `messages/*.json` с географией |
| Национальные страницы сделок `/sale`, `/rent`, `/short-term-rent` и их title в Sanity (`catalogSeoPage-propertiesRoot`) | `src/app/[locale]/sale` и т.д., `lib/routes/listingQueryRewrite.ts` | слаги маршрутов в коде |
| SEO-лаборатория, эксперимент E03 (21.10.2026): на `/sale/apartment` и `/sale/house` в title и description живые цифры (число объявлений, цена от, медиана €/м² у квартир); остальные типы - контроль | `SEO_LAB_E03_TEST_TYPES` в `src/lib/seo/listingSeoCopy.ts`, тексты `Seo.listing.typeTitleFrom`, `typeDescriptionMedian`, `typeDescriptionCount` в `messages/*.json` | разбор 18.11.2026: оставить на всех типах или вернуть простой текст; формулировки про Албанию |
| Гайд по Дурресу (PDF-магнит) | `src/lib/guides/durresGuide*.ts`, `messages/*.json` → `DurresGuide`, `Guides` | удалить или заменить |
| Индекс цен: методика, датасеты, пресс-кит | `src/app/[locale]/prices`, `src/app/data/prices/**`, `messages/*.json` → `PriceIndex`, `ZoneMetrics` | считается из объектов, но тексты про Албанию |
| Албанская страница референтных цен `/sq/cmimet-e-references` (гипотеза SEO 5, эксперимент E01, 21.10.2026): официальные таблицы VKM 132/2018 и 457/2023 (лек/м²), проект 2025 по Дурресу, калькулятор (вычет 1 %/год до 30 %, налог 15 %, переоценка 5 %, налог на здание 0,05 %), FAQ, источники; только локаль sq | `src/lib/referencePrices/{data,calc,copy}.ts` (+ тест на пример ASHK), `components/referencePrices/*`, маршрут `app/[locale]/cmimet-e-references`, `STATIC_CODE_PAGES`, `NON_LISTING_FIRST_SEGMENTS`, ссылка в футере sq (`FOOTER_MARKET_HUB`, `Footer.nav.referencePrices`), `llms.txt` | албанское законодательство; перепроверить при новом VKM о референтных ценах; при продаже удалить или заменить налоговыми таблицами страны покупателя |
| Калькуляторы-страницы (21.10.2026, ссылочные магниты): `/{locale}/calculators/purchase-costs` (нотариус, ASHK, юрист, присяжный переводчик, агентство) и `/{locale}/calculators/rental-yield` (долгая и посуточная аренда, расходы, налог 15 %), все 8 локалей, `fr` в белом списке пилота | `src/lib/calculatorPages/{config,localize,page}.ts` (слаг лендинга-источника `property-for-sale-albania-by-the-sea`, цены примеров в FAQ €100 000 и €110 000), запрос `fetchCalculatorSections` в `lib/sanity/queries/landing.ts`, маршруты `app/[locale]/calculators/*`, `components/calculatorPages/*`, `STATIC_CODE_PAGES`, `NON_LISTING_FIRST_SEGMENTS`, `PARTIAL_LOCALE_PATHS.fr`, `llms.txt`, тексты `messages/*.json` → `CalculatorPages` (в т. ч. `cms`: переводы подписей и примечаний статей расходов и пресетов по `_key` из Sanity) | цифры статей и пресетов берутся из секций калькуляторов этого лендинга в Sanity; модель доходности и её константы (комиссии платформ, ремонт, страховка, покупка 1,35 % + €938) в `lib/calculators/roi.ts`; ссылки на связанные страницы (`/prices`, `blog/legal-guide-buyers`, города Дуррес, Тирана, Влёра, Саранда) - наши; при продаже переписать под страну покупателя |
| База знаний и факты для ИИ | Sanity `knowledgeArticle`, `knowledgeFact`, `knowledgeSource` + `src/lib/knowledge/*`, `app/api/knowledge/facts` | данные наши, механика общая |
| Локали `en uk ru sq it pl de fr` и их порядок, названия | `src/i18n/routing.ts`, `src/lib/i18n/localeNames.ts`, `messages/*.json`; списки локалей ещё в `lib/leads/clickRequest.ts`, `lib/telegram/bot/format.ts`, `app/api/registration-request/route.ts`, `components/register/RegistrationRequestForm.tsx`, `lib/cookie-consent/locales/*`, `public/offline.html` | покупатель выбирает свои |
| Французский пилот (с 21.10.2026): `fr` - частичная локаль, индексируются только хаб `/fr/immobilier-albanie`, два гайда под ним, каталог Дурреса и 5 районов, 30 объектов (белый список) | `src/lib/frenchPilot/config.ts` (+ `load.ts`), `PARTIAL_LOCALE_PATHS` в `lib/seo/localeIndexing.ts`, `fr` в кластере `durres-property` (`lib/seo/pages/data/keywordEvidence.ts`), маршрут `app/[locale]/immobilier-albanie/**`, компоненты `components/frenchPilot/*`, запрос `lib/sanity/queries/frenchPilot.ts`, ссылка в футере (`FOOTER_MARKET_HUB.fr`), `STATIC_CODE_PAGES`, `llms.txt`, тексты `messages/fr.json` → `FrenchPilot` | переводы текстов Sanity для этих страниц лежат в репозитории (`src/data/contentTranslations/fr.json`, поиск по английскому тексту, `lib/i18n/contentTranslations.ts`), потому что датасет на лимите атрибутов; адреса объектов `fr` выводятся из английских (`lib/property/propertyUrl.ts`). Проверка английского на страницах: `node scripts/contentTranslationsCoverage.ts`. Откат: убрать `fr` из `routing.locales` и папки пилота |
| Валюты и курс по умолчанию | `src/lib/currency/*`, siteSettings `displayCurrencies` | - |
| Фото Албании для пустых состояний | `messages/*.json` → `AlbaniaPhotos`, `public/**` | заменить |
| Telegram-бот: сценарии, тексты, deep-links `p_/i_/g_/s_` | `src/lib/telegram/**`, `app/api/telegram/webhook`, `messages/*.json` → `TelegramBot` | механика общая, тексты с брендом |
| Статусы заявок из Telegram (21.10.2026): кнопки «Связался / Просмотр / Торг / Сделка ✅ / Отказ / Спам» под каждой заявкой, вопрос цены сделки, сводка по понедельникам в каждый чат, воронка и 1 % владельца | `src/lib/leads/{status,funnel}.ts`, `src/lib/notifications/leads/postLeadToTeam.ts`, `src/lib/telegram/bot/leadStatus.ts`, `app/api/cron/leads-weekly` (`vercel.json`, пн 07:00 UTC), `scripts/leads-funnel.ts`, поля `lead.statusHistory/dealPrice/telegramPosts` в админке; описание `reports/domlivo-leads-funnel.md` | механика общая; русские подписи кнопок, доля 1 % (`OWNER_SHARE`) и часовой пояс Тираны - наши |
| Крон-маршруты и IndexNow | `app/api/cron/*`, `app/api/indexnow/*`, `vercel.json` | общие |

### 3.4 Тексты в `messages/*.json`

В `en.json` на 2026-10-20: 125 строк с брендом или географией. По пространствам имён (сколько строк): PriceIndex 20, About 13, Catalog 12, Seo 10, AlbaniaPhotos 9, TelegramBot 8, PartnerLanding 7, Home 4, HowToPublish 4, Register 3, Guides 3, DurresGuide 3, AiSearch 3, ZoneMetrics 3, NewBuilds 3, Listing 3, остальные по 1–2. Остальные шесть языков повторяют структуру. Скрипт сверки:

```bash
node -e 'const m=require("./messages/en.json");const h=[];(function w(o,p){for(const k in o){const v=o[k];if(typeof v==="string"){if(/Domlivo|Albania|Durr|Tirana|Vlor|Sarand/.test(v))h.push(p+k)}else w(v,p+k+".")}})(m,"");console.log(h.join("\n"))'
```

## 4. Что лежит в Sanity (схемы передаются, данные нет)

Типы документов (`domlivo-admin/schemaTypes/documents`): `property`, `city`, `district`, `country`, `developer`, `agent`, `amenity`, `propertyType`, `zoneMetrics`, `catalogSeoPage`, `landingPage`, `blogPost`, `blogAuthor`, `blogCategory`, `blogSettings`, `knowledgeArticle`, `knowledgeFact`, `knowledgeSource`, `imageCredit`, `tracker`, `siteSettings`, `lead`, `locationRequest`, `registrationRequest`, `botAccessRequest`, `searchSubscription`.

`siteSettings` уже умеет без деплоя: название и слоган, логотип, контакты и адрес, фото менеджера и офиса, время ответа, отзывы, соцсети, тексты футера, ссылки на политики и гайды, настройки объектов, видео «как опубликовать», валюты и курсы, SEO по умолчанию, настройки бота (`botEnabled`, `botOwnerTelegramUserId`, `botDefaultAgent`, `siteBaseUrl`, `botAllowPublish`).

Ограничение: датасет `production` на 2026-10-20 использует 2026 из 2000 путей атрибутов тарифа, новые типы документов не записываются. У покупателя с пустым датасетом этой проблемы нет.

## 5. Аккаунты и сервисы, которые в коробку не входят

Vercel (team `cndevs-projects`), Sanity `g4aqp6ex`, домен и DNS `domlivo.com`, Google Search Console (`sc-domain:domlivo.com`, URL-префикс `https://www.domlivo.com/`), Bing Webmaster, GA4/GTM, Microsoft Clarity, PostHog 312129, Telegram-боты и чаты, IndexNow-ключ, Fixer, Anthropic, пароль редактора, Instagram/Telegram-канал, disavow-файл, аккаунты партнёров. Все данные Sanity (объекты, лиды, агенты, статьи, фото) - собственность Domlivo и в продажу кода не входят.

## 6. Инструкция для ИИ-модели при продаже или копировании

Выполнять по порядку, каждый шаг отдельным PR, после каждого `tsc`, `eslint`, `vitest`, `next build`.

1. **Форк.** Скопировать оба репозитория в организацию покупателя. Удалить `docs/seo/**` с нашими метриками, `docs/analytics`, `docs/experiments`, `reports`-ссылки, файлы `src/lib/seo/pages/data/keywordEvidence.ts` и `experiments.ts` заменить пустыми структурами той же формы.
2. **Sanity.** Создать проект и датасет покупателя. В админке заменить `projectId` в `sanity.config.ts`, `sanity.cli.ts` и фолбэки в `scripts/**` (grep `g4aqp6ex`). Задеплоить студию. Записать минимальные документы: `siteSettings`, `country`, хотя бы один `city`, один `agent`, один `propertyType`, один `property`. Поставить вебхук `POST {site}/api/revalidate/sanity` с `Authorization: Bearer <SANITY_REVALIDATE_SECRET>` на publish.
3. **Env.** Заполнить все переменные из §2 на Vercel (Production и Preview) и в `.env.local`. Отключить то, что покупатель не использует: без Telegram-токенов бот молчит, без `ANTHROPIC_API_KEY` ИИ-поиск скрыт, без `NEXT_PUBLIC_POSTHOG_KEY` PostHog не грузится.
4. **Идентификаторы в коде.** Пройти §3.1 построчно: аналитика, контакты, команда, JSON-LD, почта.
5. **Бренд.** Пройти §3.2 по grep `domlivo`; заменить имя, домен, манифест PWA, OG, llms.txt, промпт ИИ, cookie-конфиг, PDF-гайд. Затем §3.4: пройти 125 строк в `en.json`, затем остальные языки (или сократить список локалей в `src/i18n/routing.ts`).
6. **География.** Переписать `src/lib/seo/pages/registry.ts` под страну и города покупателя (слаги должны совпадать с документами `city`/`district` в Sanity), проверить `validateRegistry.ts`. Удалить `src/lib/partnerLandings/**`, маршрут `partners/cactus`, ссылки на него в `GeoListingRoute.tsx`, `ListingPlaceLinks.tsx`, `sitemap-static.xml`, `llms.txt`, тексты `PartnerLanding` (или переписать под партнёра покупателя). Удалить или переписать гайд по Дурресу и `AlbaniaPhotos`.
7. **Юридическое.** `Legal`, `privacy`, `terms`, `image-credits`: юрлицо, адрес, почта, источники фото покупателя.
8. **Деплой и проверка.** Vercel из main, домен, `NEXT_PUBLIC_SITE_URL`. Проверить curl'ом: главная, каталог города, объект, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/manifest.webmanifest`, вебхук ревалидации (401 без секрета), Telegram-вебхук (401 без секрета). Прогнать Lighthouse. Завести GSC, Bing, IndexNow покупателя.
9. **Отчёт покупателю:** таблица «переменная → значение задано», список оставшихся упоминаний (`grep -rli "domlivo\|albania" src messages` должен быть пуст или объяснён).

Оценка на 2026-10-20: шаги 1–3 около часа, 4–7 один-два дня работы модели с проверками, потому что бренд и география размазаны по 60 файлам кода и 125 строкам текстов на 7 языках. Чтобы сократить до часа, нужен рефакторинг в `site.config.ts` (отложен владельцем 2026-10-20: сначала функциональность, потом коробка).

## 7. Журнал изменений реестра

| Дата | Что добавлено |
|---|---|
| 2026-10-20 | Первая версия: env, идентификаторы, бренд, география, партнёрские лендинги Cactus, PostHog, инструкция для модели |
| 2026-10-21 | Французский пилот: локаль `fr`, белый список страниц, переводы Sanity в репозитории |
| 2026-10-21 | Партнёры первыми в каталоге (`FEATURED_AGENCIES`) |
| 2026-10-21 | Калькуляторы-страницы `/calculators/purchase-costs` и `/calculators/rental-yield` |
