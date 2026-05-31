// Barrel: Sanity fetchers are split by domain under ./queries/*.
// Importers keep using `@/lib/sanity/client`; the implementations live in the
// per-domain query modules and shared types in `@/types/catalog`.
export * from './queries/home';
export * from './queries/property';
export * from './queries/settings';
export * from './queries/catalog';
export * from './queries/landing';
export * from './queries/blog';
export * from './queries/agent';
export * from './queries/sitemap';
export type { CatalogSort, CatalogFilters, CatalogProperty, CatalogResult } from '@/types/catalog';
export type { AgentContactPage } from './agentAdapter';
