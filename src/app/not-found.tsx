import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

/**
 * Last-resort 404: paths that never reached the `[locale]` segment, so there is
 * no dictionary, no header and no footer to render. Localised 404s are handled
 * by `[locale]/not-found.tsx`, which has all three.
 *
 * `/` is the one safe destination from here — the middleware negotiates the
 * visitor's locale and redirects.
 */
const ErrorPage = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-5 py-20 text-center">
      <Image
        src="/images/404.png"
        alt=""
        width={420}
        height={386}
        unoptimized
        className="h-auto w-full max-w-[320px]"
      />
      <h1 className="font-display text-3xl md:text-5xl font-bold text-dark dark:text-white">
        This page does not exist
      </h1>
      <p className="text-lg text-dark/60 dark:text-white/60">
        The link may be out of date, or the page has moved.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 font-semibold text-white transition-colors duration-200 ease-out hover:bg-dark"
      >
        Go to the homepage
      </Link>
    </main>
  );
};

export default ErrorPage;
