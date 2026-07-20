import * as React from 'react'

/**
 * Shared server-rendered frame for calculator sections: section spacing,
 * heading typography (as in other data blocks), card container and the
 * mandatory disclaimer in small print under the interactive island.
 */
export function CalcSectionShell({
  title,
  subtitle,
  disclaimer,
  children,
}: {
  title?: string
  subtitle?: string
  disclaimer: string
  children: React.ReactNode
}) {
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        {(title || subtitle) && (
          <div className="mb-10 max-w-3xl">
            {title ? (
              <h2 className="text-3xl sm:text-4xl lg:text-52 font-medium text-dark dark:text-white leading-[1.15]">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="text-dark/55 dark:text-white/55 text-base sm:text-lg mt-3 whitespace-pre-line leading-relaxed">
                {subtitle}
              </p>
            ) : null}
          </div>
        )}
        <div className="rounded-2xl border border-dark/10 dark:border-white/15 p-5 sm:p-8">
          {children}
          <p className="mt-6 text-xs leading-relaxed text-dark/50 dark:text-white/50 whitespace-pre-line">
            {disclaimer}
          </p>
        </div>
      </div>
    </section>
  )
}
