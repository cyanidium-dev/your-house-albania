# PHASE 2 — ARCHITECTURE (Refactor Prompt)

> Самодостаточный промпт. Проект: Domlyva — Next.js 15 + Sanity + next-intl. Предусловие: Phase 1 выполнена. Поведение и публичные сигнатуры НЕ меняются — это чистый рефакторинг.

## Цель
Снять главный архитектурный долг: разбить god-file `client.ts`, устранить дублирование GROQ-проекций, удалить лишний слой landing-обёрток, унифицировать breadcrumbs и SEO-адаптеры. Подготовить почву под SaaS.

## Список файлов
- `src/lib/sanity/client.ts` (2687 строк, 39 fetch-функций)
- `src/components/landing/sections/*.tsx` (обёртки), `sections/impl/*.tsx`, `sectionRenderers/handlers/*.tsx`, `sectionRenderers/registry.tsx`, `sections/index.ts`
- `src/components/shared/{Blog,Cities,CityLanding,Favorites,PropertyDetail}Breadcrumb/`, `shared/Breadcrumb/`, `shared/CatalogBreadcrumb/`, `shared/BreadcrumbJsonLd.tsx`
- `src/lib/sanity/{landingSeoAdapter,propertySeoAdapter,blogSeoAdapter,homeSeoAdapter,socialMetadataResolution}.ts`

## Задачи
1. **A1 + D1 — разбить client.ts.**
   - Создать `src/lib/sanity/groq/projections.ts` с константами: `IMAGE_ASSET` (`asset->{_id,url,metadata}`), `CITY_PROJECTION`, `DISTRICT_PROJECTION`, `TYPE_PROJECTION`, `MAIN_IMAGE`, `LANDING_SECTIONS` (из `landingPageSectionsProjection`). Подставить во все GROQ-строки вместо повторяющихся вручную блоков (asset ~35×, city ~9×, district/type ~6×).
   - Вынести функции в `src/lib/sanity/queries/{home,property,catalog,landing,blog,agent,sitemap,settings}.ts` по доменам (распределение — см. §2 TECHNICAL_AUDIT_2026.md).
   - `client.ts` оставить как фабрику клиента (`getClient`) + barrel-реэкспорт всех функций, чтобы внешние импорты не сломались.
2. **A2 — удалить слой landing-обёрток.** Каждый `sections/<Name>Section.tsx`, который просто рендерит `sections/impl/<Name>SectionImpl` (например `PropertyCarouselSection.tsx:4-8`), удалить. Обновить `sections/index.ts` и все `handlers/*` так, чтобы они импортировали `impl/*` напрямую.
3. **D2 — унификация breadcrumbs.** Оставить `shared/Breadcrumb` (рендер) + `shared/BreadcrumbJsonLd`. Логику построения `BreadcrumbItem[]` из `shared/{Blog,Cities,CityLanding,Favorites,PropertyDetail}Breadcrumb` перенести в чистые билдер-функции `src/lib/routes/breadcrumbs.ts`. Удалить 5 компонентов-обёрток. `CatalogBreadcrumb` оставить как есть (доменная логика). Обновить все импорты.
4. **D5 — единый buildMetadata.** Дублирующую цепочку title→description→og-image из `*SeoAdapter.ts` собрать в `buildMetadata(seoLayer, siteDefaults)` в `socialMetadataResolution.ts`. Адаптеры только маппят свой документ во вход.
5. **S3 + TS5 — типизация границы.** Вынести тип `CatalogProperty` из `client.ts` в `src/types/`. Для `unknown`-возвращающих функций ввести типизированные обёртки или прямую типизацию через adapter-типы.

## Что МОЖНО менять
- Внутреннюю организацию `lib/sanity`, импорты, расположение файлов.
- Внутреннюю структуру landing-рендеринга (без изменения визуала).

## Что НЕЛЬЗЯ менять
- Публичное поведение fetch-функций (вход/выход, кэш-семантику) — только перенос и дедуп.
- GROQ-логику запросов (только вынос повторяющихся фрагментов в константы; результат запроса идентичен).
- Визуальный результат landing-секций и breadcrumbs.
- Удалять мёртвый код шаблона (это Phase 4).

## Критерии успеха
- `client.ts` < 150 строк (фабрика + barrel); функции разнесены по `queries/*`.
- Проекции не повторяются: `grep -c "asset-> { _id, url, metadata }"` по `queries/*` → каждый максимум 1 импорт константы.
- Слой `sections/<Name>Section.tsx`-passthrough удалён; `handlers/*` импортируют `impl/*`.
- 5 breadcrumb-обёрток удалены; их логика в `lib/routes/breadcrumbs.ts`.
- Сборка и рендер идентичны до/после (визуальная регрессия — нет).

## Обязательные проверки после выполнения
- [ ] `npx tsc --noEmit` — 0 ошибок
- [ ] `npm run build` — успешно
- [ ] Визуальная проверка: главная, каталог, property, blog, city, agent — рендерятся как раньше
- [ ] hreflang/canonical/JSON-LD в `<head>` не изменились (diff метаданных)
- [ ] `wc -l src/lib/sanity/client.ts` — существенно меньше 2687
- [ ] Все прежние импорты `@/lib/sanity/client` продолжают резолвиться (barrel)
