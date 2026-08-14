/**
 * Tailwind class-string constants, remapped to Domlivo's tokens
 * (`primary` #07be8a, `dark` #172023; light-first with `dark:` variants via
 * next-themes). Layout mirrors the source module: mobile stacks the actions,
 * desktop keeps one inline line; Accept and Reject share size and weight —
 * GDPR requires rejecting to be as easy and as prominent as accepting.
 */

export const bannerClass =
  "fixed inset-x-0 bottom-0 z-[90] border-t border-dark/10 bg-white/95 backdrop-blur-md px-5 sm:px-8 lg:px-12 py-5 dark:border-white/10 dark:bg-dark/95";

export const bannerInnerClass =
  "container mx-auto max-w-8xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between";

export const bannerTitleClass = "text-[15px] font-semibold text-dark dark:text-white";

export const bannerBodyClass =
  "mt-1 text-[13.5px] leading-[1.55] text-dark/60 dark:text-white/60 max-w-[720px] [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80";

export const bannerActionsClass =
  "flex flex-col gap-3 shrink-0 lg:flex-row lg:items-center";

export const bannerChoiceRowClass =
  "flex gap-3 w-full lg:w-auto [&>button]:flex-1 lg:[&>button]:flex-none";

export const buttonBaseClass =
  "inline-flex h-11 items-center justify-center rounded-full px-5 text-[13.5px] font-semibold transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const buttonPrimaryClass = "bg-primary text-white hover:bg-primary/85";

export const buttonSecondaryClass =
  "border border-dark/15 bg-dark/5 text-dark hover:bg-dark/10 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10";

export const buttonGhostClass =
  "text-dark/60 hover:text-dark underline underline-offset-4 decoration-dark/25 px-2 dark:text-white/60 dark:hover:text-white dark:decoration-white/30";

export const overlayClass =
  "fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-dark/50 backdrop-blur-[6px] p-0 sm:p-6";

export const dialogClass =
  "w-full sm:max-w-[560px] max-h-[85vh] overflow-y-auto rounded-t-[22px] sm:rounded-[22px] border border-dark/10 bg-white text-dark p-6 sm:p-7 dark:border-white/10 dark:bg-dark dark:text-white";

export const dialogTitleClass =
  "text-[22px] font-bold tracking-[-0.01em] text-dark dark:text-white";

export const dialogSubClass = "mt-1 text-[13.5px] leading-[1.5] text-dark/60 dark:text-white/60";

export const categoryRowClass =
  "flex items-start justify-between gap-4 border-t border-dark/10 py-4 first:border-t-0 dark:border-white/10";

export const categoryLabelClass = "text-[14.5px] font-semibold text-dark dark:text-white";

export const categoryDescClass =
  "mt-0.5 text-[13px] leading-[1.5] text-dark/60 dark:text-white/60";

export const alwaysOnClass =
  "text-[10.5px] tracking-[0.14em] uppercase text-dark/40 dark:text-white/40 whitespace-nowrap pt-1";

export const dialogFooterClass =
  "mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-dark/10 pt-5 dark:border-white/10";

export const switchTrackClass =
  "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-checked:bg-primary bg-dark/15 dark:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60";

export const switchThumbClass =
  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200";

export const switchThumbCheckedClass = "translate-x-5";

/** Footer trigger — styled to sit in the dark footer credits row. */
export const settingsLinkClass =
  "inline-flex items-center whitespace-nowrap text-white/50 underline-offset-[3px] transition-colors hover:text-primary hover:underline cursor-pointer bg-transparent border-0 p-0";
