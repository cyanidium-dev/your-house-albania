# TECHNICAL AUDIT 2026 — Domlyva

> **Статус:** единственный актуальный технический документ проекта.
> **Метод:** аудит проведён с нуля по текущему коду. Все прошлые отчёты признаны устаревшими (см. §0). Источник правды — код, не документация.
> **Дата:** 2026-05-31 · **Стек (по коду):** Next.js 15.2.8 (App Router, React 19), Sanity `@sanity/client` 7, next-intl 4, Tailwind v4, MapLibre GL, кастомный landing-editor. Локали: `en, uk, ru, sq, it`. ~31.8k строк TS/TSX, 282 файла в `src`, 65 client-компонентов.

---

## 0. Устаревшие отчёты (удалить)

| Файл | Почему устарел | Действие |
|------|----------------|----------|
| `ARCHITECTURE_REPORT.md` | Датирован март 2025, описывает шаблон **до** Sanity и i18n: «i18n packages never used», «no sitemap/robots», «no city/district model», «static arrays». В текущем коде всё это есть. Противоречит коду по всем разделам. | **Удалить** (содержимое заменено этим документом) |
| `properties-sticky-filters-audit.md` | Узкий ad-hoc отчёт по одной фиче (sticky-фильтры), не отражает архитектуру; статус выполнения непроверяем. | **Удалить** или перенести в issue |
| `docs/blog-sanity-frontend-contract.md` | Контракт данных — **не отчёт**, актуален как спецификация. | Оставить |
| `docs/registration-request-sanity-frontend-contract.md` | То же — спецификация. | Оставить |
| `README.md` | Базовый. | Оставить, обновить отдельно |

Правило проекта: **один источник правды — этот файл**. Новые отчёты не плодить; обновлять этот.

---

## 1. Executive Summary

**Что крепко (не трогать без причины):**
1. **SEO-слой зрелый.** hreflang + x-default (`src/lib/seo/hreflang.ts`), canonical, 6 раздельных sitemap-роутов (`src/app/sitemap-*.xml/route.ts`), `robots.ts`, JSON-LD (`propertyJsonLd.ts` → RealEstateListing+Product, `siteJsonLd.ts` → Organization+WebSite, `breadcrumbJsonLd.ts`), осмысленный noindex для thin-content (`listingIndexPolicy.ts`).
2. **Серверные границы безопасны.** Секреты не `NEXT_PUBLIC_`, write-token и telegram-token server-only, GROQ параметризован (`$param`), editor-сессия на HMAC + `timingSafeEqual`, валидация входов в API (whitelists, honeypot, лимиты длины).
3. **Каталог и routing продуманы.** Гео-маршруты `[country]/[city]/[[...filters]]`, агентские страницы, deal-типы, legacy-редиректы в `middleware.ts`.
4. **i18n-сообщения синхронизированы** (5×`messages/*.json` совпадают по структуре); добавление 6-го языка — через одну точку `src/i18n/routing.ts`.

**Что болит (главные риски):**
5. **`src/lib/sanity/client.ts` — god-file 2687 строк / 39 fetch-функций** со встроенными GROQ. №1 архитектурный долг.
6. **Дублирование GROQ-проекций** (`asset->{_id,url,metadata}` ~35×, `city->/district->/type->` по 6–9×).
7. **Остров мёртвого кода шаблона** (`src/data/*`, `src/types/domain/*`, `src/app/api/*.tsx`, `Auth/*`, `donationContext`, `components/Breadcrumb`) — см. §4.
8. **Тройная индирекция landing-секций** (`sections/` обёртка → `impl/` → `handlers/`).
9. **7 почти одинаковых Breadcrumb-компонентов.**
10. **`noImplicitAny: false`** при `strict: true` + весь Sanity-слой возвращает `unknown` → скрытые `any`.
11. **`maplibre-gl` (~150 КБ) статически в client-бандле каталога.**
12. **`signCookie.ts` использует `SANITY_WRITE_TOKEN` как fallback-секрет.**
13. **SaaS-готовность ≈ 20%** — нет tenant/agency-изоляции.

**Вердикт:** боевое ядро (каталог + SEO + безопасность границ) — production-grade. Технический долг сконцентрирован в трёх местах: **god-file `client.ts`**, **дублирование/индирекция в landing+breadcrumbs**, **остров мёртвого template-кода**. Всё это устранимо без переписывания ядра.

---

## 2. Architecture Review

### 2.1 Карта проекта (фактическая)

```
src/
  app/
    [locale]/            страницы (каталог, property, blog, agent, cities, deal-типы, контакты, register, favorites)
      [country]/[city]/[[...filters]]   ← основной гео-каталог
      {rent,sale,short-term-rent}/[[...filters]]  ← non-geo deal-каталог
      agent/[agent]/[country]/[city]/[[...filters]]
      {appartment,luxury-villa,office-spaces,residential-homes}/  ← LEGACY (мок-данные, см. §4)
    api/                 РОУТЫ: catalog, contact-agent, registration-request, editor/*, cron, favorites-properties, footer-cities
    api/*.tsx            НЕ роуты — экспорт статических данных (МЁРТВО, см. §4)
    editor/              кастомный landing-редактор
    sitemap-*.xml/, robots.ts, manifest.ts, icon.tsx, apple-icon.tsx
    context/             AuthDialogContext (почти мёртв), donationContext (МЁРТВ)
  components/
    catalog/             каталог, фильтры, карта, баннеры
    landing/             sections/ + sections/impl/ + sectionRenderers/handlers/ (тройной слой)
    Properties/          LEGACY категорийные листинги (мок)
    shared/              property/PropertyCard, 7×Breadcrumb, Blog, BrandButton, JsonLd
    Blog/, Layout/, Auth/(МЁРТВ), property/, contact/, register/, favorites/, city/, deal/, how-to-publish/
    ui/                  shadcn (button, accordion, carousel, Skeleton, ConfirmModal)
  lib/
    sanity/              client.ts(2687) + ~20 адаптеров + localized.ts
    routes/, seo/, catalog/, currency/, notifications/, date/, video/, blog/
  features/editor/       auth, components, data, lib, state — изолированная фича (хорошо)
  contexts/              CurrencyContext, CatalogViewContext
  hooks/useFavorites.ts
  i18n/                  routing, request, navigation
  types/                 живые типы + types/domain/* (МЁРТВ)
  data/                  LEGACY статические данные (частично мёртвые)
  middleware.ts
```

### 2.2 Проблемы структуры

| # | Проблема | Файлы | Почему плохо | Как исправить | Приоритет |
|---|----------|-------|--------------|---------------|-----------|
| A1 | God-file Sanity | `src/lib/sanity/client.ts` (2687 стр., 39 fn) | Невозможно ревьюить/мёржить/тестировать; блок масштабирования | Разбить на `queries/{home,property,catalog,landing,blog,agent,sitemap,settings}.ts` + `groq/projections.ts`; `client.ts` = фабрика клиента + barrel | **P0** |
| A2 | Тройная индирекция landing | `landing/sections/*.tsx` → `sections/impl/*.tsx` ← `sectionRenderers/handlers/*.tsx` | Слой `sections/<Name>Section.tsx` — чистый passthrough (`PropertyCarouselSection.tsx:4-8`: `return <Properties {...props}/>`). 14 лишних файлов | Удалить слой обёрток, handler импортирует `impl/` напрямую | **P1** |
| A3 | `app/api/*.tsx` — данные в папке роутов | `featuredproperty.tsx`, `footerlinks.tsx`, `propertyhomes.tsx`, `testimonial.tsx` | Концептуально неверно: `app/api` для route handlers, а тут экспорт массивов | Удалить (мертвы, §4) | P1 |
| A4 | `app/context/` и `contexts/` — две папки контекстов | `src/app/context/*`, `src/contexts/*` | Раздвоение конвенции | Слить в `src/contexts/`, мёртвые удалить | P2 |
| A5 | `components/utils/` рядом с `lib/` | `components/utils/{markdown,markdownToHtml,validateEmail}.ts` | Утилиты не в `lib` | Перенести в `src/lib/` | P3 |
| A6 | Гигантский резолвер | `src/lib/routes/listingRouteResolver.ts` (622 стр.) | Концентрация роутинг-логики | Разнести по типам маршрутов | P2 |

---

## 3. Duplicate Code Review

| # | Дубль | Файлы | Доказательство | Как исправить | Приоритет |
|---|-------|-------|----------------|---------------|-----------|
| D1 | **GROQ-проекции** | `src/lib/sanity/client.ts` | `asset-> { _id, url, metadata }` ~35×; `"city": city-> {_id,title,"slug":slug.current}` ~9×; `district->` ~6×; `type->` ~6×; `mainImage: gallery[0]{...}` 5× — всё вручную | Вынести константы в `src/lib/sanity/groq/projections.ts`, подставить | **P1** |
| D2 | **Breadcrumbs ×7 + legacy** | `shared/{Blog,Cities,CityLanding,Favorites,PropertyDetail}Breadcrumb`, `shared/Breadcrumb`, `shared/CatalogBreadcrumb`, `components/Breadcrumb`(legacy, 0 импортёров) | 5 обёрток строят `BreadcrumbItem[]` → зовут базовый `Breadcrumb` + `BreadcrumbJsonLd`. Логика реальна только в `CatalogBreadcrumb` (229 стр.) | Один `Breadcrumb({items, jsonLd})`; билдеры items → `src/lib/routes/breadcrumbs.ts`; `CatalogBreadcrumb` оставить | P1 |
| D3 | **Blog-карточки ×2** | `Blog/BlogCardClient.tsx`(client) vs `shared/Blog/blogCard.tsx`(server) | Почти идентичный UI карточки | Один `BlogCard` с режимом; `'use client'` только для интерактива | P2 |
| D4 | **Категорийные листинги ×4** | `Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}/index.tsx` | `OfficeSpaces` и `Residential` **байт-в-байт** идентичны (`getProperties().slice(0,3)`), отличие — имя | Удалить (мок-данные) или параметризовать + подключить к Sanity | P1 |
| D5 | **SEO-адаптеры** | `landingSeoAdapter.ts`, `propertySeoAdapter.ts`, `blogSeoAdapter.ts`, `homeSeoAdapter.ts` | Повторяют цепочку title→description→og-image поверх `socialMetadataResolution.ts` | Единый `buildMetadata(seoLayer, siteDefaults)` | P2 |
| D6 | **Кнопки ×2** | `ui/button.tsx`(CVA/shadcn) vs `shared/BrandButton.tsx`(своя система) | Две независимые системы вариантов | BrandButton выразить через CVA-варианты button | P2 |
| D7 | **Контакт-роуты ×3** | `[locale]/{contacts, contactus, contact/thank-you}` | `contactus` — legacy-редирект | Подтвердить редиректы, удалить лишнее в навигации | P3 |

---

## 4. Dead Code Review

> Подтверждено трассировкой импортов (`grep` по `src/`). Это **единая связка наследия шаблона**, которую можно удалить целиком.

### 4.1 Полностью мёртвые (0 внешних импортёров)

| Файл/группа | Доказательство | Действие |
|-------------|----------------|----------|
| `src/data/featuredProperty.ts` | 0 импортёров | Удалить |
| `src/data/testimonials.ts` | 0 импортёров | Удалить |
| `src/data/footer.ts` | 0 импортёров | Удалить |
| `src/data/blog.ts` | 0 импортёров | Удалить |
| `src/data/navigation.ts` | 0 импортёров | Удалить |
| `src/types/domain/*` (property, blogPost, testimonial, footerLink, featuredPropertyImage, index) | импортируются **только** из мёртвого `src/data/*` | Удалить весь `types/domain/` |
| `src/app/api/featuredproperty.tsx` | импортируется только из `data/featuredProperty.ts`(мёртв) | Удалить |
| `src/app/api/footerlinks.tsx` | только из `data/footer.ts`(мёртв) | Удалить |
| `src/app/api/testimonial.tsx` | только из `data/testimonials.ts`(мёртв) | Удалить |
| `src/app/context/donationContext.tsx` | 0 импортёров (наследие donation-шаблона) | Удалить |
| `src/components/Auth/{SignIn,SignUp,SocialSignIn,SocialSignUp}` | 0 внешних импортёров; используют только `AuthDialogContext` | Удалить весь `components/Auth/` |
| `src/app/context/AuthDialogContext.tsx` | используется только мёртвым `Auth/*` | Удалить вместе с Auth |
| `src/components/Breadcrumb/index.tsx` (legacy, 26 стр.) | 0 импортёров | Удалить |

**Цепочка:** `app/api/*.tsx` → `data/*` → `types/domain/*` — три слоя, держащиеся только друг за друга. Удаляются вместе. `noImplicitAny:false` маскировал это (нет ошибок «unused»).

### 4.2 Полу-legacy (routed, но на мок-данных) — решить осознанно

| Связка | Состояние | Решение |
|--------|-----------|---------|
| `src/data/properties.ts` ← `app/api/propertyhomes.tsx` ← `types/propertyHomes.ts`(**живой!**) | `data/properties.ts` тянут 4 категорийных компонента | См. ниже |
| `Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}` + страницы `app/[locale]/{appartment,luxury-villa,office-spaces,residential-homes}/page.tsx` | Страницы **routed**, имеют реальный i18n + `buildStaticListingMetadata` (см. `appartment/page.tsx`), но листинг рендерится из мок `getProperties()` | **Либо** подключить листинг к Sanity-каталогу, **либо** удалить страницы целиком вместе с `data/properties.ts` + `api/propertyhomes.tsx` |

> ⚠️ Тонкость: `src/types/propertyHomes.ts` (тип `PropertyHomes`) — **живой**, его используют `landing/sections/impl/PropertyCarouselSectionImpl.tsx`, `handlers/propertyCarouselSection.tsx`, `Properties/PropertyList`, `property/SimilarPropertiesCarousel`. Удалять **нельзя**. Дубль здесь — это мёртвый `types/domain/property.ts`, а не `propertyHomes.ts`.

---

## 5. Sanity Review

| # | Находка | Файл/строки | Действие | Приоритет |
|---|---------|-------------|----------|-----------|
| S1 | God-file 2687 стр., 39 fetch-функций | `client.ts` | Разбить по доменам (см. A1) | **P0/P1** |
| S2 | Дубли проекций (см. D1) | `client.ts` | `groq/projections.ts` | P1 |
| S3 | ~8 функций возвращают `Promise<unknown\|null>` / `unknown[]\|null` | `fetchHomePage`(34), `fetchPropertyBySlug`(286), `fetchSiteSettings`(579), `fetchActivePropertyTypes`(622), `fetchBlogPosts`(1979), `fetchBlogSettings`(2059), `fetchBlogPostBySlug`(2086), `fetchBlogCategories`(2158) | Типизировать через adapter-типы; ввести `fetch*Typed` обёртки | P1 |
| S4 | Кэш непоследователен: ~13 функций в `unstable_cache`, ~26 без; нет `tags`/`revalidate` | `client.ts` | Систематизировать кэш + webhook-инвалидация по `tags` | P2 |
| S5 | SEO-адаптеры дублируют цепочку метаданных (D5) | `*SeoAdapter.ts` | `buildMetadata()` | P2 |
| S6 | `localized.ts`: маппинг `al → sq` (legacy-код локали) | `src/lib/sanity/localized.ts` | Зафиксировать в доке; убрать `al` после прекращения legacy-URL | P3 |

**Хорошо:** `localized.ts` — единая точка резолва мультиязычных полей, используется консистентно во всех адаптерах.

---

## 6. SEO Review

**Сильно, менять мало.**

| Область | Состояние | Файл |
|---------|-----------|------|
| hreflang + x-default | Есть для 5 локалей; x-default жёстко на `en` | `src/lib/seo/hreflang.ts` |
| canonical | Есть, path-only для фильтр-страниц | `src/lib/seo/catalogListingMetadata.ts` |
| sitemap | 6 раздельных: static, cities, types, non-geo-listings, properties, blog | `src/app/sitemap-*.xml/route.ts` |
| robots | Есть | `src/app/robots.ts` |
| JSON-LD | RealEstateListing+Product, Organization+WebSite+SearchAction, BreadcrumbList, BlogArticle | `src/lib/seo/*JsonLd.ts` |
| noindex thin-content | Порог `LISTING_DEAL_TYPE_NOINDEX_THRESHOLD`; query-params → noindex | `src/lib/seo/listingIndexPolicy.ts` |

| # | Дефект | Файл/строки | Действие | Приоритет |
|---|--------|-------------|----------|-----------|
| SEO1 | Хардкод текста на агентских страницах вне i18n | `catalog/CatalogHero.tsx:45,47` (`Properties by ${name}`, `Showing listings from this agent`) | t-ключи в 5 json | **P0** |
| SEO2 | x-default жёстко `en`, не из `routing.defaultLocale` | `hreflang.ts` | Брать дефолт из routing | P2 |
| SEO3 | Нет Person/RealEstateAgent JSON-LD на agent-страницах, LocalBusiness на city | — | Добавить схемы | P2 |

---

## 7. Performance Review

| # | Находка | Файл/строки | Почему плохо | Действие | Приоритет |
|---|---------|-------------|--------------|----------|-----------|
| P1a | `maplibre-gl` (~150 КБ + CSS) статически | `catalog/map/PropertiesMap.tsx:4,6` | Грузится в бандл каждой страницы каталога, даже когда карта вне вьюпорта | `next/dynamic({ssr:false})` + lazy-mount | **P0** |
| P1b | Карта тянется eager из тела каталога | `catalog/CatalogBodyClient.tsx` (549 стр.) | Тот же бандл-эффект | Монтировать карту по требованию | P1 |
| P2 | `<img>` вместо `next/image` | `catalog/PropertyCatalogBannerCard.tsx` | Нет WebP/srcset/оптимизации | Заменить на `next/image` + `sizes` | P1 |
| P3 | Очень крупные client-компоненты | `MarketingContentSectionImpl.tsx`(1107), `PropertySearchBar.tsx`(863), `PropertyCard.tsx`(689), `PropertiesMap.tsx`(620) | TBT, ре-рендеры, сложность | Разбить (хук + презентационные части) | P2 |
| P4 | 65 client-компонентов | — | Часть могла бы быть server | Аудитировать кандидатов без hooks/handlers | P2 |

---

## 8. TypeScript Review

| # | Находка | Файл/строки | Действие | Приоритет |
|---|---------|-------------|----------|-----------|
| TS1 | `noImplicitAny: false` гасит `strict:true` | `tsconfig.json:13` | `true`, починить ошибки | **P0** |
| TS2 | Sanity-слой возвращает `unknown` (см. S3) → скрытые `any` у вызывающих | `client.ts` | Типизировать границу | P1 |
| TS3 | Мёртвые дубли типов `types/domain/*` (см. §4) | `src/types/domain/*` | Удалить | P1 |
| TS4 | `: any` / `as any` точечно | `Auth/SignIn`,`Auth/SignUp`(мёртвы), `components/utils/markdown.ts`, `registry.tsx:61,70,80` | Типизировать `registry.tsx`; остальное уйдёт с мёртвым кодом | P2 |
| TS5 | `CatalogProperty` объявлен внутри `client.ts` | `client.ts` | Вынести в `src/types/` и реэкспортировать | P2 |

---

## 9. Security Review

| # | Находка | Файл/строки | Риск | Действие | Приоритет |
|---|---------|-------------|------|----------|-----------|
| SEC1 | Секрет editor-сессии падает на `SANITY_WRITE_TOKEN` | `features/editor/auth/signCookie.ts:13-19` | При отсутствии `EDITOR_SESSION_SECRET` в проде ключ подписи = write-token | Сделать `EDITOR_SESSION_SECRET` обязательным, убрать fallback | **P0** |
| SEC2 | Cron-роут без rate-limit | `app/api/cron/update-currency-rates/route.ts` | Проверяет `CRON_SECRET`, но ручной вызов `?secret=` не ограничен | Добавить ограничение/Vercel-cron-only | P2 |
| SEC3 | Нет CSRF на POST-роутах | `app/api/*` | Полагается на `SameSite=lax` | Приемлемо для API; добавить токены при формах | P3 |

**Хорошо (подтверждено):** секреты не `NEXT_PUBLIC_` (`.env.example`); write/telegram-token server-only; GROQ параметризован; editor-сессия HMAC+`timingSafeEqual` (`signCookie.ts:37-58`); валидация входов в `contact-agent`, `registration-request`, `editor/landing/save` (whitelists, honeypot, лимиты).

---

## 10. SaaS Readiness Review

**Текущая готовность ≈ 20%.** Архитектура одно-тенантная.

| Сущность | Сейчас | Нужно для SaaS |
|----------|--------|----------------|
| agency / tenant | **отсутствует** | корневая сущность изоляции; ссылка в каждом property/landing/agent |
| developer (застройщик) | отсутствует как сущность | отдельная сущность, привязка к property/project |
| project (ЖК) | отсутствует | группировка property |
| property | есть (Sanity) | + `agency._ref` |
| city / country | есть | общий справочник (cross-tenant) |
| language | есть (5) | оставить глобальным |
| subscription / plan | **отсутствует** | биллинг, лимиты по тарифу |
| lead | частично (telegram-уведомления) | сохранять в Sanity/БД с привязкой к agency |
| user role | **отсутствует** (только 1 editor-пароль) | RBAC: agency-admin, agent, editor |

**Где архитектура завязана на один сайт:**
- 39 GROQ-функций в `client.ts` **не фильтруют по tenant** → каждую придётся править. **Это аргумент сделать §A1 (разбиение client.ts) ДО роста кодовой базы** — добавить `&& agency._ref == $agencyId` в централизованные `queries/*` дешевле, чем в 39 inline-запросах.
- Editor-аутентификация — один глобальный пароль (`EDITOR_PASSWORD`), без пользователей/ролей (`signCookie.ts:21`).
- `siteSettings` — единый документ; для SaaS нужен per-tenant.
- Базовый URL/брендинг (`siteJsonLd.ts`, `siteUrl.ts`) — захардкожен на один бренд (Domlyva).

**Минимум, чтобы потом не переписывать половину:** ввести `tenant/agency` в схемы и в слой запросов **на этапе разбиения `client.ts`**, заложить `agencyId` в сигнатуры fetch-функций (даже если пока всегда один tenant).

---

## 11. Refactoring Roadmap

> Сгруппировано по **выгоде**, не по папкам.

### PHASE 1 — CRITICAL
**Что даёт:** убирает прод-риски (секрет, типобезопасность), быстрый выигрыш по бандлу и i18n.
**Риск:** низкий (точечные правки), кроме `noImplicitAny` (всплывут ошибки — управляемо).
**Время:** ~1–2 дня.
**Файлы:** `tsconfig.json:13`, `features/editor/auth/signCookie.ts:13-19`, `catalog/map/PropertiesMap.tsx`, `catalog/CatalogBodyClient.tsx`, `catalog/PropertyCatalogBannerCard.tsx`, `catalog/CatalogHero.tsx:45,47`, `messages/*.json`.
**Задачи:** SEC1, TS1, P1a, P2, SEO1.

### PHASE 2 — ARCHITECTURE
**Что даёт:** снимает главный долг (god-file, индирекция, breadcrumbs), упрощает поддержку и подготавливает SaaS.
**Риск:** средний (большой объём переноса; поведение не меняется).
**Время:** ~3–5 дней.
**Файлы:** `lib/sanity/client.ts` → `lib/sanity/queries/*` + `groq/projections.ts`; `landing/sections/*` (удалить обёртки); `shared/*Breadcrumb` → `lib/routes/breadcrumbs.ts`; `*SeoAdapter.ts`.
**Задачи:** A1, A2, D1, D2, D5, S3, TS5.

### PHASE 3 — PERFORMANCE
**Что даёт:** Core Web Vitals (LCP/TBT), меньше client-JS.
**Риск:** средний (разбиение крупных компонентов).
**Время:** ~3–4 дня.
**Файлы:** `MarketingContentSectionImpl.tsx`(1107), `PropertySearchBar.tsx`(863), `PropertyCard.tsx`(689), `PropertiesMap.tsx`(620), кандидаты client→server.
**Задачи:** P3, P4, S4 (кэш).

### PHASE 4 — CLEANUP
**Что даёт:** минус ~целый остров мёртвого кода, меньше путаницы и размера репо.
**Риск:** низкий (удаление подтверждённо неиспользуемого).
**Время:** ~1 день.
**Файлы:** `src/data/*` (кроме навигации/properties — проверить), `src/types/domain/*`, `src/app/api/{featuredproperty,footerlinks,testimonial}.tsx`, `Auth/*`, `donationContext.tsx`, `AuthDialogContext.tsx`, `components/Breadcrumb/index.tsx`, `ARCHITECTURE_REPORT.md`, `properties-sticky-filters-audit.md`; решить судьбу `Properties/{4}` + категорийных страниц.
**Задачи:** §4 целиком, §0, D3, D4, D6, A3, A4, A5.

### PHASE 5 — SAAS PREPARATION
**Что даёт:** возможность подключать несколько агентств без переписывания.
**Риск:** высокий (схемы + все запросы), потому делать ПОСЛЕ Phase 2.
**Время:** ~1–2 недели.
**Файлы:** Sanity-схемы (вне этого репо/в studio), `lib/sanity/queries/*` (добавить `agencyId`), editor-auth (RBAC), `siteSettings`.
**Задачи:** §10 целиком.

---

## 12. Task Priorities

| ID | Задача | Приоритет | Эффект | Сложность | Риск | Время |
|----|--------|-----------|--------|-----------|------|-------|
| SEC1 | Убрать fallback секрета на write-token | P0 | Безопасность прод | низк | низк | 0.5ч |
| TS1 | `noImplicitAny: true` + фиксы | P0 | Типобезопасность | средн | средн | 4–8ч |
| P1a | maplibre → dynamic | P0 | LCP/TBT каталога | низк | низк | 2ч |
| SEO1 | i18n хардкод CatalogHero | P0 | SEO/UX 4 языков | низк | низк | 1ч |
| P2 | `<img>` → next/image | P1 | Оптимизация картинок | низк | низк | 0.5ч |
| A1 | Разбить client.ts | P1 | Поддержка/SaaS | выс | средн | 1–2д |
| D1 | GROQ-проекции в константы | P1 | DRY/поддержка | средн | низк | 3–4ч |
| A2 | Удалить landing-обёртки | P1 | −14 файлов | низк | низк | 2–3ч |
| D2 | Унификация breadcrumbs | P1 | −5 файлов | средн | низк | 3–4ч |
| §4 | Удалить остров мёртвого кода | P1 | −20+ файлов | низк | низк | 4ч |
| D4 | Категорийные страницы (решить) | P1 | Убрать мок-данные | средн | средн | 4ч |
| S3 | Типизировать Sanity-границу | P1 | Типы | средн | средн | 4–6ч |
| D5 | Единый buildMetadata | P2 | DRY SEO | средн | низк | 3ч |
| D6 | Слить кнопки | P2 | Дизайн-консистентность | низк | низк | 2ч |
| S4 | Систематизировать кэш | P2 | Perf/инвалидация | средн | средн | 4ч |
| P3 | Разбить мега-компоненты | P2 | Perf/поддержка | выс | средн | 2–3д |
| SEO2 | x-default из routing | P2 | SEO-корректность | низк | низк | 0.5ч |
| SEO3 | Person/LocalBusiness JSON-LD | P2 | Rich-результаты | низк | низк | 2ч |
| A4/A5 | Слить контексты/utils | P3 | Чистота | низк | низк | 1ч |
| §5/§10 | SaaS tenant-слой | P3→P1(позже) | Монетизация | выс | выс | 1–2нед |

---

## 13. Generated Refactor Prompts

Готовые промпты — в `docs/refactor-prompts/`:
- `phase-1-critical.md`
- `phase-2-architecture.md`
- `phase-3-performance.md`
- `phase-4-cleanup.md`
- `phase-5-saas.md`

Каждый самодостаточен (цель, файлы, ограничения, что можно/нельзя менять, критерии успеха, проверки).

---

## TOP 20 — лучшее соотношение эффект/затраты

| # | Изменение | Эффект | Затраты | P | Файлы |
|---|-----------|--------|---------|---|-------|
| 1 | maplibre → `next/dynamic({ssr:false})` | −150 КБ JS на каталоге, LCP/TBT | 2ч | P0 | `PropertiesMap.tsx`, `CatalogBodyClient.tsx` |
| 2 | Убрать fallback секрета на write-token | закрыть прод-уязвимость | 0.5ч | P0 | `signCookie.ts:13-19` |
| 3 | Удалить остров мёртвого кода (§4.1) | −20+ файлов, ясность | 4ч | P1 | `data/*`, `types/domain/*`, `Auth/*`, `donationContext`, `api/*.tsx`, `components/Breadcrumb` |
| 4 | i18n хардкод CatalogHero | перевод агентских страниц | 1ч | P0 | `CatalogHero.tsx:45,47`, `messages/*` |
| 5 | `noImplicitAny: true` | типобезопасность всего слоя Sanity | 4–8ч | P0 | `tsconfig.json:13` |
| 6 | GROQ-проекции в `groq/projections.ts` | DRY ~35 повторов, меньше багов | 3–4ч | P1 | `client.ts` |
| 7 | `<img>` → `next/image` | оптимизация баннер-карточек | 0.5ч | P1 | `PropertyCatalogBannerCard.tsx` |
| 8 | Удалить landing-обёртки `sections/*.tsx` | −14 файлов, −1 слой | 2–3ч | P1 | `landing/sections/*`, `handlers/*` |
| 9 | Унификация 7 breadcrumbs → 1 + билдеры | −5 файлов, DRY | 3–4ч | P1 | `shared/*Breadcrumb`, `lib/routes/breadcrumbs.ts` |
| 10 | Удалить устаревшие отчёты | один источник правды | 0.1ч | P1 | `ARCHITECTURE_REPORT.md`, `properties-sticky-filters-audit.md` |
| 11 | Разбить `client.ts` на `queries/*` | поддержка + база для SaaS | 1–2д | P1 | `lib/sanity/*` |
| 12 | Решить судьбу категорийных страниц | убрать мок-данные из прод-роутов | 4ч | P1 | `Properties/{4}`, `data/properties.ts`, `app/[locale]/{4}` |
| 13 | Типизировать Sanity-границу (`unknown`→типы) | надёжность | 4–6ч | P1 | `client.ts`, адаптеры |
| 14 | Вынести `CatalogProperty` в `types/` | развязать компоненты от client.ts | 1ч | P2 | `client.ts`, `types/` |
| 15 | Единый `buildMetadata()` | DRY 4 SEO-адаптеров | 3ч | P2 | `*SeoAdapter.ts` |
| 16 | Слить `button` + `BrandButton` | дизайн-консистентность | 2ч | P2 | `ui/button.tsx`, `shared/BrandButton.tsx` |
| 17 | x-default из `routing.defaultLocale` | корректный hreflang | 0.5ч | P2 | `hreflang.ts` |
| 18 | Person/LocalBusiness JSON-LD | rich-результаты в нише | 2ч | P2 | agent/city страницы |
| 19 | Систематизировать `unstable_cache` + tags | perf + webhook-инвалидация | 4ч | P2 | `client.ts` |
| 20 | Заложить `agencyId` в сигнатуры queries | дешёвая SaaS-подготовка | 4ч | P2→ | `lib/sanity/queries/*` |

---

*Документ сгенерирован без изменения исходного кода. Все ссылки указывают на текущее состояние репозитория.*
