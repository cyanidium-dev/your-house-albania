# PHASE 5 — SAAS PREPARATION (Refactor Prompt)

> Самодостаточный промпт. Проект: Domlyva — Next.js 15 + Sanity + next-intl, сейчас одно-тенантный. Предусловие: **Phase 2 ОБЯЗАТЕЛЬНА** (запросы должны быть централизованы в `lib/sanity/queries/*` до добавления tenant-фильтрации). Высокий риск — делать поэтапно за флагом.

## Цель
Заложить мультитенантную архитектуру (несколько агентств/застройщиков на одной платформе), чтобы переход на SaaS не требовал переписывания каталога и запросов.

## Контекст (текущая привязка к одному сайту)
- 39 (теперь разнесённых) GROQ-функций не фильтруют по tenant.
- Editor-auth — один глобальный `EDITOR_PASSWORD`, без пользователей/ролей (`signCookie.ts`).
- `siteSettings` — единый документ; брендинг/URL захардкожены под один бренд (`siteJsonLd.ts`, `siteUrl.ts`).

## Список файлов / зон
- Sanity-схемы (в Studio-репозитории): `property`, `agent`, `landingPage`, `city`, `siteSettings` + новые `agency`, `developer`, `project`, `subscription`, `lead`, `user`/`role`.
- `src/lib/sanity/queries/*` — добавить параметр `agencyId`.
- `src/features/editor/auth/*` — RBAC вместо одного пароля.
- `src/lib/siteUrl.ts`, `src/lib/seo/siteJsonLd.ts`, `siteSettingsAdapter.ts` — per-tenant брендинг.

## Задачи (поэтапно, за feature-flag)
1. **Схемы.** Ввести сущность `agency` (tenant) как корень изоляции. Добавить `agency` reference в `property`, `landingPage`, `agent`, `lead`. Спроектировать `developer`, `project` (группировка property), `subscription`/`plan`, `lead` (сохранять заявки с привязкой к agency), `user` + `role` (agency-admin / agent / editor). `city`/`country`/`language` оставить глобальными (cross-tenant справочники).
2. **Запросы.** В `queries/*` добавить опциональный `agencyId` в сигнатуры и `&& agency._ref == $agencyId` в GROQ. На переходный период — дефолт «единственный tenant», чтобы не ломать текущий сайт.
3. **Tenant-резолвинг.** Определить стратегию (поддомен / путь / домен) и резолвить `agencyId` в `middleware.ts` → прокидывать в страницы.
4. **Per-tenant siteSettings/брендинг.** `siteSettings` сделать привязанным к `agency`; URL/логотип/JSON-LD брать из tenant-настроек.
5. **RBAC.** Заменить единый `EDITOR_PASSWORD` на пользователей с ролями; editor-сессия несёт `agencyId` + роль; проверки прав в `editor/landing/save` и др. мутациях.
6. **Лиды.** Заявки (`contact-agent`, `registration-request`) сохранять в Sanity/БД с `agency._ref`, не только в Telegram.

## Что МОЖНО менять
- Схемы Sanity (аддитивно, с миграцией).
- Сигнатуры `queries/*` (с обратной совместимостью на переходный период).
- Auth/middleware/брендинг.

## Что НЕЛЬЗЯ менять
- Ломать текущий одно-тенантный сайт (всё за флагом / с дефолтным tenant).
- Глобальные справочники `city/country/language` делать per-tenant.
- Менять публичный URL-контракт существующих страниц без редиректов.

## Критерии успеха
- Можно создать второе `agency` и его данные не видны под первым (изоляция в запросах).
- Текущий сайт работает без изменений при одном tenant (обратная совместимость).
- RBAC: разные роли имеют разный доступ к editor-мутациям.
- Лиды сохраняются с привязкой к agency.

## Обязательные проверки после выполнения
- [ ] `npx tsc --noEmit` и `npm run build` — успешно
- [ ] Тест изоляции: данные tenant A недоступны в контексте tenant B
- [ ] Регресс одно-тенантного режима: текущие URL, SEO, каталог — без изменений
- [ ] Аудит запросов: ни один `queries/*` не отдаёт cross-tenant данные без явного намерения
- [ ] Проверка прав: мутации editor отклоняются при недостаточной роли
