import { Icon } from '@iconify/react'
import Image from 'next/image'
import Link from 'next/link'

type ContactPageContentProps = {
  locale: string
}

export function ContactPageContent({ locale }: ContactPageContentProps) {
  return (
    <div className="container mx-auto max-w-8xl px-5 2xl:px-0 pb-14 pt-20 md:pb-28 md:pt-32">
      <div className="mb-16">
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <span>
            <Icon
              icon={'ph:house-simple-fill'}
              width={20}
              height={20}
              className="text-primary"
            />
          </span>
          <p className="text-base font-semibold text-badge dark:text-white/90">
            Contact us
          </p>
        </div>
        <div className="text-center">
          <h3 className="mb-3 text-4xl font-medium leading-10 tracking-tighter text-black dark:text-white sm:text-52 sm:leading-14">
            Have questions? ready to help!
          </h3>
          <p className="text-xm font-normal leading-6 tracking-tight text-black/50 dark:text-white/50">
            Looking for your dream home or ready to sell? Our expert team offers
            personalized guidance and market expertise tailored to you.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-black/10 p-4 shadow-xl dark:border-white/10 dark:shadow-white/10">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
          <div className="relative w-fit">
            <Image
              src={'/images/contactUs/contactUs.jpg'}
              alt="wall"
              width={497}
              height={535}
              className="h-full rounded-2xl brightness-50"
              unoptimized={true}
            />
            <div className="absolute left-6 top-6 flex flex-col gap-2 lg:left-12 lg:top-12">
              <h5 className="text-xl font-medium tracking-tight text-white xs:text-2xl mobile:text-3xl">
                Contact information
              </h5>
              <p className="text-sm font-normal text-white/80 xs:text-base mobile:text-xm">
                Ready to find your dream home or sell your property? We’re here
                to help!
              </p>
            </div>
            <div className="absolute bottom-6 left-6 flex flex-col gap-4 text-white lg:bottom-12 lg:left-12">
              <Link href={`/${locale}`} className="w-fit">
                <div className="group flex w-fit items-center gap-4">
                  <Icon icon={'ph:phone'} width={32} height={32} />
                  <p className="text-sm font-normal group-hover:text-primary xs:text-base mobile:text-xm">
                    +1 0239 0310 1122
                  </p>
                </div>
              </Link>
              <Link href={`/${locale}`} className="w-fit">
                <div className="group flex w-fit items-center gap-4">
                  <Icon icon={'ph:envelope-simple'} width={32} height={32} />
                  <p className="text-sm font-normal group-hover:text-primary xs:text-base mobile:text-xm">
                    support@gleamer.com
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-4">
                <Icon icon={'ph:map-pin'} width={32} height={32} />
                <p className="text-sm font-normal xs:text-base mobile:text-xm">
                  Blane Street, Manchester
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1/2">
            <form>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-6 lg:flex-row">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    autoComplete="username"
                    placeholder="Name*"
                    required
                    className="w-full rounded-full border border-black/10 px-6 py-3.5 outline-primary focus:outline dark:border-white/10"
                  />
                  <input
                    type="number"
                    name="mobile"
                    id="mobile"
                    autoComplete="mobile"
                    placeholder="Phone number*"
                    required
                    className="w-full rounded-full border border-black/10 px-6 py-3.5 outline-primary focus:outline dark:border-white/10"
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  placeholder="Email address*"
                  required
                  className="rounded-full border border-black/10 px-6 py-3.5 outline-primary focus:outline dark:border-white/10"
                />
                <textarea
                  rows={8}
                  cols={50}
                  name="message"
                  id="message"
                  placeholder="Write here your message"
                  required
                  className="rounded-2xl border border-black/10 px-6 py-3.5 outline-primary focus:outline dark:border-white/10"
                ></textarea>
                <button
                  type="submit"
                  className="mobile:w-fit w-full rounded-full bg-primary px-8 py-4 text-base font-semibold text-white duration-300 hover:cursor-pointer hover:bg-dark"
                >
                  Send message
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
