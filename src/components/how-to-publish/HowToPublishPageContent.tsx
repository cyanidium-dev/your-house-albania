import { getTranslations } from 'next-intl/server'
import { CtaButton } from '@/components/landing/sections/CtaSection'
import { parseVideoEmbedUrl } from '@/lib/video/embedUrl'
import { EmbeddedVideo } from './EmbeddedVideo'
import styles from './HowToPublishSteps.module.css'

type Props = {
  locale: string
  videoUrl: string | undefined
}

export async function HowToPublishPageContent({ locale, videoUrl }: Props) {
  const t = await getTranslations('HowToPublish')
  const trimmed = videoUrl?.trim() ?? ''
  const hasEmbeddableVideo = Boolean(trimmed && parseVideoEmbedUrl(trimmed))
  const steps = [t('step1'), t('step2'), t('step3')] as const

  return (
    <>
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <div
            className={
              hasEmbeddableVideo
                ? 'grid gap-10 lg:grid-cols-2 lg:items-start'
                : 'max-w-3xl'
            }
          >
            <div className="flex min-w-0 flex-col gap-6">
              <h1 className="text-3xl font-semibold leading-[1.2] tracking-tight text-dark dark:text-white md:text-4xl lg:text-5xl">
                {t('heroTitle')}
              </h1>
              <h2 className="text-xl font-medium leading-snug text-dark/90 dark:text-white/90 md:text-2xl">
                {t('heroSubtitle')}
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-dark/60 dark:text-white/60 md:text-lg">
                {t('heroBody')}
              </p>
              {hasEmbeddableVideo ? (
                <a
                  href="#how-to-publish-video"
                  className="inline-flex h-11 w-fit items-center justify-center rounded-full bg-primary px-8 font-semibold text-white transition-colors duration-200 ease-out hover:bg-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {t('heroCta')}
                </a>
              ) : null}
            </div>
            {hasEmbeddableVideo ? (
              <div className="min-w-0 w-full">
                <EmbeddedVideo videoUrl={videoUrl} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
          <div className="flex max-w-3xl flex-col gap-8">
            <h2 className="text-2xl font-medium leading-[1.2] text-dark dark:text-white md:text-3xl">
              {t('block2Title')}
            </h2>
            <p className="text-base leading-relaxed text-dark/60 dark:text-white/60 md:text-lg">
              {t('block2Body')}
            </p>
            <ol className={styles.steps}>
              {steps.map((label) => (
                <li key={label} className={`${styles.step} text-base leading-relaxed text-dark/75 dark:text-white/75 md:text-lg`}>
                  {label}
                </li>
              ))}
            </ol>
            <div className="pt-2">
              <CtaButton href="/register" label={t('block2Cta')} locale={locale} variant="primary" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
