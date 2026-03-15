import { Icon } from '@iconify/react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export type FaqData = {
  title?: string;
  items: { question: string; answer: string }[];
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

  return (
        <section id='faqs' className="py-16 md:py-24">
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
                            {t('badge')}
                        </p>
                        <h2 className='lg:text-52 text-40 leading-[1.2] font-medium text-dark dark:text-white'>
                            {title}
                        </h2>
                        <p className='text-dark/50 dark:text-white/50 pr-20'>
                            {t('description')}
                        </p>
                        <div className="my-8">
                            <Accordion type="single" defaultValue="item-0" collapsible className="w-full flex flex-col gap-6">
                                {items.map((item, i) => (
                                  <AccordionItem key={i} value={`item-${i}`}>
                                    <AccordionTrigger>{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                      {item.answer}
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
