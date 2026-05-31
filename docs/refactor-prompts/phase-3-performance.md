# PHASE 3 — PERFORMANCE (Refactor Prompt)

> Самодостаточный промпт. Проект: Domlyva — Next.js 15 + Sanity + next-intl. Предусловие: Phase 1–2 выполнены. Фокус — Core Web Vitals и объём client-JS.

## Цель
Уменьшить client-бандл и TBT: разбить мега-компоненты, перевести лишние client-компоненты в server, систематизировать кэш Sanity.

## Список файлов
- `src/components/landing/sections/impl/MarketingContentSectionImpl.tsx` (1107 строк, client)
- `src/components/catalog/PropertySearchBar.tsx` (863 строк, client)
- `src/components/shared/property/PropertyCard.tsx` (689 строк, client)
- `src/components/catalog/map/PropertiesMap.tsx` (620 строк, client)
- `src/lib/sanity/queries/*` (после Phase 2) — для кэша
- Кандидаты client→server: пройтись `grep -rln "'use client'" src/` (65 файлов) и найти компоненты без hooks/handlers/браузерных API.

## Задачи
1. **P3 — разбить мега-компоненты** (поведение и верстка идентичны):
   - `PropertyCard.tsx` → вынести `src/lib/property/cardFormatters.ts` (статус-лейблы, форматирование, обрезка тизера), под-компоненты `PropertyCardGallery`, `PropertyBadges`.
   - `PropertySearchBar.tsx` → вынести хук `useCatalogFilters` (вся state-логика) + презентационные под-компоненты фильтров.
   - `MarketingContentSectionImpl.tsx` → разбить по типам контент-блоков; чистые рендереры выделить.
2. **P4 — client→server.** Для каждого `'use client'`-компонента без интерактива (нет `useState/useEffect/onClick/window/...`) убрать директиву и сделать server-компонентом. Особое внимание — крупным презентационным секциям landing.
3. **S4 — кэш Sanity.** В `queries/*` привести `unstable_cache` к единому шаблону с явными `tags` и `revalidate`; добавить кэш «тяжёлым» некэшированным функциям (`fetchHomePage`, `fetchCatalogProperties`, `fetchBlogPosts`, `fetchActivePropertyTypes`). Подготовить теги под webhook-инвалидацию из Sanity.

## Что МОЖНО менять
- Внутреннюю декомпозицию перечисленных компонентов.
- Директивы `'use client'` там, где интерактив отсутствует.
- Конфигурацию кэша (`tags`/`revalidate`).

## Что НЕЛЬЗЯ менять
- Визуальный результат и поведение UI.
- GROQ-запросы (только обёртка кэша).
- Публичные пропсы компонентов, используемые снаружи (сохранить совместимость).

## Критерии успеха
- Ни один из 4 целевых компонентов не превышает ~350 строк.
- Каждый client-компонент действительно использует client-функциональность (иначе → server).
- Все «тяжёлые» fetch-функции кэшированы с тегами; теги документированы.
- Lighthouse/PageSpeed: TBT и JS-payload на каталоге и главной не выросли (в идеале снизились).

## Обязательные проверки после выполнения
- [ ] `npx tsc --noEmit` — 0 ошибок
- [ ] `npm run build` — успешно; сравнить размеры чанков до/после
- [ ] Lighthouse (mobile) на `/sq` (главная) и странице каталога — Performance не упал
- [ ] Визуальная регрессия: PropertyCard, фильтры, marketing-секции, карта — без изменений
- [ ] `grep -rln "'use client'" src/ | wc -l` — не больше, чем было (в идеале меньше)
