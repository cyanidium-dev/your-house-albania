import FeaturedProperty from '@/components/Home/FeaturedProperty'
import Hero from '@/components/Home/Hero'
import Properties from '@/components/Home/Properties'
import Services from '@/components/Home/Services'
import Testimonial from '@/components/Home/Testimonial'
import BlogSmall from '@/components/shared/Blog'
import GetInTouch from '@/components/Home/GetInTouch'
import FAQ from '@/components/Home/FAQs'

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;

  return (
    <main>
      <Hero locale={locale} />
      <Services locale={locale} />
      <Properties locale={locale} />
      <FeaturedProperty locale={locale} />
      <Testimonial />
      <BlogSmall locale={locale} />
      <GetInTouch />
      <FAQ />
    </main>
  )
}
