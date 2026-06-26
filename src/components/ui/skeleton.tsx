import { cn } from "@/lib/utils";

/**
 * Unified premium shimmer skeleton. Used app-wide.
 *
 * Replaces the old `animate-pulse bg-muted` block. A single light sweep
 * across a low-contrast tile reads as "loading" without strobing.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-[rgba(255,255,255,0.04)]",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)]",
        "before:animate-[uf-shimmer_1.4s_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
