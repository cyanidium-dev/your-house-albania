import { Icon } from '@iconify/react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export type AboutData = {
  title?: string;
  description?: string;
  benefits?: string[];
} | null;

const About: React.FC<{ locale: string; aboutData?: AboutData }> = async ({
  aboutData,
}) => {
  const t = await getTranslations('Home.faq');
  const badge = 'About';
  const title = aboutData?.title || t('title');
  const description = aboutData?.description || t('description');
  const benefits = Array.isArray(aboutData?.benefits) && aboutData.benefits.length > 0
    ? aboutData.benefits.slice(0, 3)
    : [];

  return (
    <section>
      <div className='container max-w-8xl mx-auto px-5 2xl:px-0'>
        <div className="grid lg:grid-cols-2 gap-10 ">
          <div className='lg:mx-0 mx-auto'>
            <Image
              src="/images/faqs/faq-image.png"
              alt='image'
              width={680}
              height={644}
              className='lg:w-full'
              unoptimized={true}
            />
          </div>
          <div className='lg:px-12'>
            <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2">
              <Icon icon="ph:house-simple-fill" className="text-2xl text-primary " />
              {badge}
            </p>
            <h2 className='lg:text-52 text-40 leading-[1.2] font-medium text-dark dark:text-white'>
              {title}
            </h2>
            <p className='text-dark/50 dark:text-white/50 pr-20'>
              {description}
            </p>
            {benefits.length > 0 && (
              <ul className="my-8 flex flex-col gap-4">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-dark dark:text-white text-base">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
