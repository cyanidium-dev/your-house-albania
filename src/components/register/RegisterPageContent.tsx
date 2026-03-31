import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Icon } from '@iconify/react'
import { RegistrationRequestForm } from './RegistrationRequestForm'

const BENEFIT_ICONS = [
  'ph:gift',
  'ph:currency-eur',
  'ph:percent',
  'ph:telegram-logo',
  'ph:layout',
  'ph:device-mobile',
  'ph:globe-hemisphere-west',
] as const

type Props = {
  locale: string
}

export async function RegisterPageContent({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'Register' })
  const benefits = [
    t('benefit1'),
    t('benefit2'),
    t('benefit3'),
    t('benefit4'),
    t('benefit5'),
    t('benefit6'),
    t('benefit7'),
  ]

  return (
    <>
      <section className="border-b border-black/5 pb-14 pt-16 dark:border-white/10 md:pb-20 md:pt-24">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-medium leading-tight tracking-tight text-dark dark:text-white md:text-4xl md:leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-lg leading-relaxed text-dark/65 dark:text-white/65 md:text-xl">
              {t('heroSubtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 pt-8 md:pb-28 md:pt-10 lg:pt-8" aria-labelledby="register-pricing-heading">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-x-10 lg:gap-y-0 xl:gap-x-12">
            <div className="flex min-w-0 flex-col lg:col-span-7 lg:h-full lg:min-h-0">
              <div className="flex h-full min-h-0 flex-col gap-3">
                {/* Separate visual block: flexible height on lg+ */}
                <div className="relative min-h-0 overflow-hidden rounded-2xl border border-dark/10 bg-dark/5 shadow-md dark:border-white/10 dark:bg-white/5 h-[200px] sm:h-[220px] lg:h-auto lg:min-h-[200px] lg:flex-1">
                  <Image
                    src="/images/contactUs/contactUs.jpg"
                    alt={t('imageAlt')}
                    fill
                    className="object-cover object-center brightness-[0.92]"
                    sizes="(max-width: 1024px) 100vw, 52vw"
                    unoptimized
                  />
                </div>

                {/* Separate card: content-driven height only */}
                <div className="shrink-0 rounded-2xl border border-dark/10 bg-white/40 p-5 shadow-md backdrop-blur-sm dark:border-white/10 dark:bg-dark/40 md:p-6">
                  <h2
                    id="register-pricing-heading"
                    className="mb-4 text-xl font-medium text-dark dark:text-white md:text-2xl"
                  >
                    {t('blockLeftTitle')}
                  </h2>
                  <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {benefits.map((text, i) => (
                      <li
                        key={text}
                        className="flex items-start gap-3 rounded-xl border border-dark/8 bg-white/60 px-3 py-2.5 text-sm text-dark/90 dark:border-white/10 dark:bg-dark/50 dark:text-white/90"
                      >
                        <Icon
                          icon={BENEFIT_ICONS[i] ?? 'ph:check-circle'}
                          className="mt-0.5 size-5 shrink-0 text-primary"
                          width={20}
                          height={20}
                          aria-hidden
                        />
                        <span className="leading-snug">{text}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-dark/60 dark:text-white/55">
                    {t('blockLeftFooter')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col lg:col-span-5 lg:min-h-0 lg:h-full">
              <RegistrationRequestForm locale={locale} className="lg:h-full lg:min-h-0" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
