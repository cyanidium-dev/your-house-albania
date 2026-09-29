# Domlivo frontend

## Layout rules (read before touching any page or section)

The page grid is defined once in `src/components/shared/layout/index.tsx` and
documented in `docs/ux/DESIGN-SYSTEM.md`.

- One container for every section: `CONTAINER` / `<Section>`. Never give a section its own `max-w-*` wrapper, and never centre content in a narrow box.
- Inside it, three widths only: full, the reading measure (`MEASURE`, start-aligned), and the split (`SPLIT` with `SPLIT_ASIDE` 5 cols + `SPLIT_MAIN` 7 cols). Text that should be narrow goes in the split with its heading, a photo or its figures beside it.
- Section headings: `SectionHeading` / `SECTION_TITLE`. Heroes: `HERO_TITLE`, `HERO_LABEL`, start-aligned.
- Vertical rhythm: `SECTION_Y`. Notes and sources belong inside their section.
- Card grids: `balancedGridClass(n)`; every card has an image slot (`NoPhotoPlate` when there is no photo).
- FAQ lists: `FaqAccordion` only.
