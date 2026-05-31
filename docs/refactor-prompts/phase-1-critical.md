# PHASE 1 — CRITICAL (Refactor Prompt)

> Самодостаточный промпт. Проект: Domlyva — Next.js 15 App Router + Sanity + next-intl, локали `en, uk, ru, sq, it`. Выполнять задачи по порядку, каждую — отдельным коммитом.

## Цель
Закрыть прод-риски (секрет, типобезопасность) и собрать дешёвые быстрые победы (бандл, i18n) без изменения архитектуры.

## Список файлов
- `tsconfig.json` (строка 13)
- `src/features/editor/auth/signCookie.ts` (строки 13–19)
- `src/components/catalog/map/PropertiesMap.tsx`
- `src/components/catalog/CatalogBodyClient.tsx`
- `src/components/catalog/PropertyCatalogBannerCard.tsx`
- `src/components/catalog/CatalogHero.tsx` (строки ~45, 47)
- `messages/en.json`, `messages/uk.json`, `messages/ru.json`, `messages/sq.json`, `messages/it.json`

## Задачи
1. **SEC1** — В `signCookie.ts` `getSecret()` оставить только `process.env.EDITOR_SESSION_SECRET`. Убрать fallback на `SANITY_WRITE_TOKEN`. Если секрет не задан — `editorAuthConfigured()` → false (логин недоступен). Обновить `.env.example` (отметить `EDITOR_SESSION_SECRET` обязательным).
2. **TS1** — В `tsconfig.json` `"noImplicitAny": false` → `true`. Запустить `npx tsc --noEmit`, починить ВСЕ ошибки явной типизацией (без `any`, без `@ts-ignore`). В Sanity-местах использовать существующие adapter-типы.
3. **P1a** — Перевести `maplibre-gl` на ленивую загрузку: в `CatalogBodyClient.tsx` импортировать `PropertiesMap` через `next/dynamic(() => import('./map/PropertiesMap'), { ssr: false, loading: ... })`. Убедиться, что `maplibre-gl` и его CSS НЕ попадают в основной бандл каталога. Карта монтируется только когда секция активна/во вьюпорте.
4. **P2** — В `PropertyCatalogBannerCard.tsx` заменить `<img>` на `next/image` с корректными `sizes` (и `priority` если above-the-fold).
5. **SEO1** — В `CatalogHero.tsx` заменить хардкод `Properties by ${name}` и `Showing listings from this agent` на ключи next-intl. Добавить ключи во все 5 `messages/*.json`.

## Что МОЖНО менять
- Перечисленные файлы и 5 json-сообщений.
- `.env.example` (документация переменных).

## Что НЕЛЬЗЯ менять
- GROQ-запросы и `client.ts` (Phase 2).
- Структуру landing-секций, breadcrumbs.
- Поведение/верстку каталога и карты (только способ загрузки).
- Никакого удаления файлов (Phase 4).

## Критерии успеха
- `npx tsc --noEmit` проходит без ошибок при `noImplicitAny: true`.
- В сборке `maplibre-gl` отсутствует в первичном чанке маршрута каталога (проверить bundle).
- Агентский заголовок отображается на всех 5 языках.
- Editor-логин работает только при заданном `EDITOR_SESSION_SECRET`.

## Обязательные проверки после выполнения
- [ ] `npx tsc --noEmit` — 0 ошибок
- [ ] `npm run build` — успешно
- [ ] `npm run lint` — без новых ошибок
- [ ] Ручная проверка: страница каталога рендерится, карта появляется при взаимодействии
- [ ] `grep -rn "noImplicitAny" tsconfig.json` → true
- [ ] `grep -n "SANITY_WRITE_TOKEN" src/features/editor/auth/signCookie.ts` → пусто
