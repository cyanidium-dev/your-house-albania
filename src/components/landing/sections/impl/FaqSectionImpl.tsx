import Image from 'next/image';
import { SectionHeader } from '@/components/landing/sectionPrimitives';
import { getTranslations } from 'next-intl/server';
import { PortableText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export type FaqData = {
  title?: string;
  items: { question: string; answer: string | PortableTextBlock[] | null | undefined }[];
  imageMode?: 'withImage' | 'withoutImage';
} | null;

type Props = {
  faqData?: FaqData | null;
};

const FAQ: React.FC<Props> = async ({ faqData }) => {
  const t = await getTranslations('Home.faq');
  const title = faqData?.title || t('title');
  const items =
    faqData?.items && faqData.items.length > 0
      ? faqData.items
      : [
          { question: t('q1'), answer: t('answer') },
          { question: t('q2'), answer: t('answer') },
          { question: t('q3'), answer: t('answer') },
        ];

  const showImage = faqData?.imageMode !== 'withoutImage';

  return (
        <section id='faqs' className="py-12 md:py-16">
            <div className='container max-w-8xl mx-auto px-5 2xl:px-0'>
                <div className={`grid gap-10 ${showImage ? 'lg:grid-cols-2' : ''}`}>
                    {showImage ? (
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
                    ) : null}
                    <div className={showImage ? 'lg:px-12' : ''}>
                        <SectionHeader
                          variant="left"
                          eyebrowText={t('badge')}
                          title={title}
                          subtitle={t('description')}
                          subtitleClassName="pr-20"
                        />
                        <div className="my-8">
                            <Accordion type="single" defaultValue="item-0" collapsible className="w-full flex flex-col gap-6">
                                {items.map((item, i) => (
                                  <AccordionItem key={i} value={`item-${i}`}>
                                    <AccordionTrigger>{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                      {typeof item.answer === 'string' ? (
                                        item.answer
                                      ) : Array.isArray(item.answer) ? (
                                        <PortableText value={item.answer} />
                                      ) : null}
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </div>
            </div>
        </section>
  );
};

export default FAQ;

