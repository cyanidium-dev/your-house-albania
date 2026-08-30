# ТЗ SEO-06a — Article-разметка и сигнал свежести на страницах гайдов

Часть SEO-06 из `docs/seo/SEO-ROADMAP-12M.md`. Исследование проведено 2026-08-30.

## Цель

Сделать гайды пригодными для цитирования в ответах ИИ и в расширенных результатах Google: добавить `Article` JSON-LD и видимую дату обновления. Сейчас 114 URL редакционного контента не сообщают поисковику ни автора, ни дату, ни тип материала.

## Контекст исследования

**Замер структурированных данных на проде (30.08.2026):**

| Тип страницы | Что отдаёт сейчас |
|---|---|
| Объект (`/property/[slug]`) | RealEstateListing, Apartment, Product, Offer, PostalAddress, PropertyValue, QuantitativeValue, BreadcrumbList |
| Статья блога (`/blog/[slug]`) | **Article**, FAQPage, Person, Organization, ImageObject, BreadcrumbList |
| **Гайд (`/guides/[slug]`)** | **только FAQPage + BreadcrumbList** |
| Каталог города | BreadcrumbList + ItemList (ItemList есть, когда в городе есть объекты) |
| Хаб районов | BreadcrumbList + ItemList |
| Инфо-страница города | FAQPage + BreadcrumbList |

Гайды — это ровно тот контент, который цитируют ИИ-движки: сравнения (`saranda-vs-ksamil`, `tirana-vs-durres`, `albania-vs-montenegro`), разборы (`buying`, `investment-albania`, `albania-market`). 19 гайдов × 6 локалей = 114 URL. Блог такую разметку получает, гайды — нет; расхождение ничем не обосновано.

**Почему это важно по цифрам.** Ahrefs: у `century21albania.com` 78 страниц цитируются в ИИ-ответах, у `domlivo.com` — 0 по всем платформам (AI Mode, ChatGPT, Gemini, Perplexity, Copilot).

**Что требует формула AEO** из knowledge base (`10-seo/seo-map.md` §5, реверс Investropa):

> п.3 «Обновлено: {дата}» + обновление после каждого полугодового HPI Банка Албании
> п.6 FAQ-блок (schema.org FAQPage) — **уже есть**
> п.7 Автор-эксперт

**Данные уже в CMS и не используются.** У `landingPage` есть поле `contentUpdatedAt` (тип `date`); запрос `fetchGuideLandingBySlug` его забирает, `buildLandingMetadata` использует — но в разметку и на страницу оно не попадает.

**Про автора — важное ограничение.** В схеме `landingPage` поля автора нет вообще (`grep -c author` = 0). Придумывать персону нельзя: это ровно тот вымысел, который запрещает CONTENT-OPS. Гайды пишет компания, поэтому `author` = `Organization` (Domlivo). schema.org это допускает, и это правда.

## Файлы

- `src/lib/seo/guideArticleJsonLd.ts` — новый билдер (моделировать по `blogArticleJsonLd.ts`).
- `src/app/[locale]/guides/[slug]/page.tsx` — рендер разметки и видимой даты.
- `src/lib/sanity/queries/landing.ts` — `fetchGuideLandingBySlug`: добавить `_updatedAt` в проекцию и в тип возврата (сейчас `contentUpdatedAt` и `topicTags` забираются, но в типе не объявлены).
- `messages/*.json` — строка «Обновлено: {date}».
- `src/lib/seo/__tests__/guideArticleJsonLd.test.ts` — тесты.

## Что можно менять

- Добавить `Article` JSON-LD на страницу гайда.
- Показать дату обновления в вёрстке гайда.
- Расширить проекцию гайда полем `_updatedAt`.
- Добавить ключи словаря во все 6 локалей.

## Что менять нельзя

- Не трогать `FAQPage`, который уже эмитит `LandingRenderer`, и не дублировать его.
- Не трогать разметку блога и объектов.
- Не выдумывать автора-человека: только `Organization`, пока в схеме нет поля.
- Не менять canonical и hreflang.
- Дату брать только из данных: `contentUpdatedAt`, иначе `_updatedAt`. Не подставлять «сегодня».

## План

1. `buildGuideArticleJsonLd(input)` → `Article` с `headline`, `description`, `image`, `datePublished`, `dateModified`, `url`, `author: Organization`, `publisher: Organization`, `inLanguage`.
2. `datePublished` = `contentUpdatedAt ?? _updatedAt`; `dateModified` = `_updatedAt ?? contentUpdatedAt`. Нет ни одного — блок не эмитить вовсе, а не подставлять текущую дату.
3. Отрендерить `<script type="application/ld+json">` на обеих ветках гайда (с выделенным hero и без).
4. Видимая строка «Обновлено: {дата}» рядом с хлебными крошками, формат — через существующий `formatBlogDate` (он уже локализован).
5. Тесты: даты берутся из данных; при отсутствии обеих — `null`; издатель и автор — `Organization`; описание опускается, когда пустое.

## Приёмка

- `curl -sL https://…/en/guides/buying | grep -o '"@type":"Article"'` → есть.
- В разметке присутствуют `dateModified`, `author.@type = Organization`, `publisher.name`.
- `FAQPage` остаётся ровно один, дубля нет.
- На странице видна дата обновления на всех 6 локалях.
- У гайда без `contentUpdatedAt` и без `_updatedAt` блок `Article` не выводится (проверить юнит-тестом, а не на живом URL).
- Rich Results Test не показывает ошибок для `Article`.

## Проверки

```
npm run lint
npm run test
npm run build
```

## Формат отчёта

Список изменённых файлов, пример готового JSON-LD с одной страницы, вывод проверок и подтверждение, что `FAQPage` не задвоился.
