"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import PropertyCard from "@/components/shared/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/favorites/PropertyCardSkeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/button";
import type { PropertyHomes } from "@/types/propertyHomes";
import { catalogPath } from "@/lib/routes/catalog";

const SKELETON_COUNT = 6;

type Props = { locale: string };

export function FavoritesContent({ locale }: Props) {
  const t = useTranslations("Favorites");
  const { favorites, clearAll, mounted } = useFavorites();
  const [properties, setProperties] = useState<PropertyHomes[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const prevFavoritesRef = useRef<string[]>([]);

  useEffect(() => {
    if (!mounted) return;

    if (favorites.length === 0) {
      setProperties([]);
      setLoading(false);
      prevFavoritesRef.current = [];
      return;
    }

    const prev = prevFavoritesRef.current;
    const prevSlugs = new Set(prev);
    const newSlugs = new Set(favorites);
    const isOnlyRemovals =
      prev.length > 0 &&
      favorites.every((s) => prevSlugs.has(s)) &&
      newSlugs.size < prevSlugs.size;

    if (isOnlyRemovals && properties.length > 0) {
      setProperties((prev) => prev.filter((p) => newSlugs.has(p.slug)));
      prevFavoritesRef.current = [...favorites];
      return;
    }

    setLoading(true);
    const slugs = favorites.join(",");
    fetch(`/api/favorites-properties?slugs=${encodeURIComponent(slugs)}&locale=${encodeURIComponent(locale)}`)
      .then((res) => res.json())
      .then((data: { items?: PropertyHomes[] }) => {
        setProperties(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setProperties([]))
      .finally(() => {
        setLoading(false);
        prevFavoritesRef.current = [...favorites];
      });
  }, [mounted, favorites, locale]);

  const handleClearConfirm = () => {
    clearAll();
    setShowClearModal(false);
  };

  if (!mounted) {
    return <p className="text-dark/50 dark:text-white/50">…</p>;
  }

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-dark/10 dark:border-white/10 p-12 text-center">
        <Icon icon="ph:heart" width={48} height={48} className="mx-auto text-dark/30 dark:text-white/30 mb-4" />
        <p className="text-dark dark:text-white text-lg mb-2">{t("emptyTitle")}</p>
        <p className="text-dark/50 dark:text-white/50 text-sm mb-6">{t("emptyDescription")}</p>
        <Link
          href={catalogPath(locale)}
          className="inline-flex items-center gap-2 py-3 px-6 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {t("browseProperties")}
          <Icon icon="ph:arrow-right" width={18} height={18} />
        </Link>
      </div>
    );
  }

  if (loading && properties.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!loading && properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dark/10 dark:border-white/10 p-12 text-center">
        <p className="text-dark dark:text-white text-lg mb-2">{t("noDataTitle")}</p>
        <p className="text-dark/50 dark:text-white/50 text-sm mb-6">{t("noDataDescription")}</p>
        <Link
          href={catalogPath(locale)}
          className="inline-flex items-center gap-2 py-3 px-6 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {t("browseProperties")}
          <Icon icon="ph:arrow-right" width={18} height={18} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowClearModal(true)}
          className="rounded-full cursor-pointer"
        >
          <Icon icon="ph:trash" width={18} height={18} className="mr-2" />
          {t("clearFavorites")}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {properties.map((item, i) => (
          <div
            key={item.slug}
            className="animate-in fade-in duration-300"
            style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}
          >
            <PropertyCard item={item} locale={locale} view="large" />
          </div>
        ))}
      </div>

      <ConfirmModal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearConfirm}
        title={t("clearModalTitle")}
        description={t("clearModalDescription")}
        confirmLabel={t("clearModalConfirm")}
        cancelLabel={t("clearModalCancel")}
        confirmVariant="destructive"
      />
    </>
  );
}
