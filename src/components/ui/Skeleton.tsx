import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: Props) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-dark/10 dark:bg-white/10", className)}
      {...props}
    />
  );
}
