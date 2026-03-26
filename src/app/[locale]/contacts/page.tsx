import { Metadata } from 'next'
import { ContactPageContent } from '@/components/contact/ContactPageContent'

export const metadata: Metadata = {
  title: 'Contact Us | Your House Albania',
}

type Props = { params: Promise<{ locale: string }> }

export default async function ContactsPage({ params }: Props) {
  const { locale } = await params
  return <ContactPageContent locale={locale} />
}
