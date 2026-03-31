import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Register' })
  return {
    title: t('thankYouMetaTitle'),
    description: t('thankYouMetaDescription'),
  }
}

export default async function RegisterThankYouPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Register' })

  return (
    <div className="container mx-auto max-w-8xl px-5 2xl:px-0 pb-14 pt-20 md:pb-28 md:pt-32">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12 xl:gap-16">
        <div className="min-w-0 flex-1">
          <h1 className="mb-4 text-3xl font-medium leading-tight tracking-tighter text-black dark:text-white sm:text-4xl sm:leading-tight">
            {t('thankYouTitle')}
          </h1>
          <p className="mb-8 max-w-xl text-base leading-relaxed text-black/70 dark:text-white/75">
            {t('thankYouDescription')}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex w-full max-w-xs justify-center rounded-full bg-primary px-8 py-4 text-center text-base font-semibold text-white transition-colors hover:bg-dark sm:w-auto"
          >
            {t('thankYouCta')}
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-md shrink-0 lg:mx-0 lg:max-w-lg">
          <Image
            src="/images/contactUs/contactUs.jpg"
            alt={t('thankYouImageAlt')}
            width={497}
            height={535}
            className="h-auto max-h-[200px] w-full rounded-2xl object-cover object-center brightness-[0.85] lg:max-h-none"
            unoptimized
          />
        </div>
      </div>
    </div>
  )
}
