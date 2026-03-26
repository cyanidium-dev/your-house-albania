import { redirect } from 'next/navigation'

type Props = { params: Promise<{ locale: string }> }

/** Legacy URL; canonical contacts route is `/[locale]/contacts`. */
export default async function ContactUsRedirect({ params }: Props) {
  const { locale } = await params
  redirect(`/${locale}/contacts`)
}
