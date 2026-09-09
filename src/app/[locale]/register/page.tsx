import { buildSimplePageMetadata } from '@/lib/seo/simplePageMetadata'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { RegisterPageContent } from '@/components/register/RegisterPageContent'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Register' })
  return buildSimplePageMetadata({
    locale,
    title: t('metaTitle'),
    description: t('metaDescription'),
    pathAfterLocale: 'register',
  })
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  return <RegisterPageContent locale={locale} />
}
