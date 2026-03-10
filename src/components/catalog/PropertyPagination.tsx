'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Props = {
  currentPage: number;
  totalPages: number;
};

export function PropertyPagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const setPage = (page: number) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(next));
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-10 flex justify-center">
      <nav className="inline-flex items-center gap-2" aria-label="Pagination">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        >
          Prev
        </Button>
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPage(n)}
            className={[
              'min-w-8 h-8 rounded-full border text-sm px-3 transition-colors duration-200',
              n === currentPage
                ? 'bg-primary text-white border-primary'
                : 'border-dark/10 dark:border-white/20 text-dark dark:text-white hover:bg-primary/10 hover:text-primary',
            ].join(' ')}
            aria-current={n === currentPage ? 'page' : undefined}
          >
            {n}
          </button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}

