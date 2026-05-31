# PHASE 4 — CLEANUP (Refactor Prompt)

> Самодостаточный промпт. Проект: Domlyva — Next.js 15 + Sanity + next-intl. Удаление подтверждённо неиспользуемого кода. Предусловие: Phase 1–2 желательны, но не обязательны.

## Цель
Удалить «остров мёртвого кода» наследия шаблона и устаревшие отчёты. Решить судьбу полу-legacy категорийных страниц.

## Список файлов

### Полностью мёртвые (0 внешних импортёров — удалить)
- `src/data/featuredProperty.ts`, `src/data/testimonials.ts`, `src/data/footer.ts`, `src/data/blog.ts`, `src/data/navigation.ts`
- `src/types/domain/` — вся папка (импортируется только мёртвым `src/data/*`)
- `src/app/api/featuredproperty.tsx`, `src/app/api/footerlinks.tsx`, `src/app/api/testimonial.tsx`
- `src/app/context/donationContext.tsx`
- `src/components/Auth/` — вся папка (SignIn, SignUp, SocialSignIn, SocialSignUp)
- `src/app/context/AuthDialogContext.tsx` (используется только мёртвым `Auth/*`)
- `src/components/Breadcrumb/index.tsx` (legacy, 0 импортёров)
- `ARCHITECTURE_REPORT.md`, `properties-sticky-filters-audit.md` (устаревшие отчёты)

### Полу-legacy (routed на мок-данных — РЕШИТЬ, не удалять вслепую)
- `src/components/Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}/index.tsx`
- `src/app/[locale]/{appartment,luxury-villa,office-spaces,residential-homes}/page.tsx`
- `src/data/properties.ts`, `src/app/api/propertyhomes.tsx`

## Задачи
1. **Перепроверить импорты** каждого файла из списка «мёртвые» командой `grep -rn "<имя>" src/` ПЕРЕД удалением. Удалять только при 0 внешних использований.
2. **Удалить** подтверждённо мёртвые файлы и устаревшие отчёты.
3. **D3** — слить blog-карточки `Blog/BlogCardClient.tsx` и `shared/Blog/blogCard.tsx` в один `BlogCard` (режим compact/full), `'use client'` только для интерактива.
4. **D6** — слить `shared/BrandButton.tsx` в варианты `ui/button.tsx` (CVA), обновить импорты.
5. **A3/A4/A5** — перенести оставшиеся `app/api/*.tsx`-данные и слить папки контекстов `app/context/` → `contexts/`; `components/utils/*` → `lib/`.
6. **Категорийные страницы** — принять решение и реализовать ОДИН из вариантов:
   - (a) подключить листинг к Sanity-каталогу (заменить `getProperties()` на реальный запрос), ИЛИ
   - (b) удалить 4 страницы + 4 компонента + `data/properties.ts` + `api/propertyhomes.tsx` (если бизнес-навигация их не требует).
   > ⚠️ НЕ удалять `src/types/propertyHomes.ts` — тип `PropertyHomes` живой (используется в landing/property каруселях).

## Что МОЖНО менять
- Удалять файлы из списка «мёртвые» после проверки.
- Перемещать утилиты/контексты, обновлять импорты.

## Что НЕЛЬЗЯ менять
- `src/types/propertyHomes.ts` (живой тип).
- `src/data/navConfig.ts`, `src/data/footerNavConfig.ts`, `src/data/index.ts` — живые (имеют импортёров).
- Логику каталога/SEO/i18n.
- Удалять что-либо без предварительной проверки `grep`.

## Критерии успеха
- Все файлы из «мёртвого» списка удалены; проект собирается.
- `grep -rn "types/domain\|donationContext\|components/Auth\|@/data/featuredProperty\|@/data/testimonials\|@/data/footer\b\|@/data/navigation" src/` → пусто.
- По категорийным страницам реализован вариант (a) или (b), мок-данных в проде не осталось.
- Размер репозитория и число файлов в `src` заметно снизились.

## Обязательные проверки после выполнения
- [ ] `npx tsc --noEmit` — 0 ошибок (отлавливает битые импорты)
- [ ] `npm run build` — успешно
- [ ] `npm run lint` — без ошибок «unused»
- [ ] Навигация по сайту: ни одна страница не отдаёт 404 из-за удалений
- [ ] `git status` — удаления осознанны, ничего лишнего
