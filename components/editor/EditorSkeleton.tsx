import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function EditorSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="bg-background flex h-dvh w-full flex-col overflow-hidden md:p-6"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 p-3 sm:p-4 md:mb-6 md:p-0">
        <Skeleton className="h-6 w-20 shrink-0" />
        <div className="flex h-5 items-center gap-1.5 sm:gap-2">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="bg-border w-px shrink-0 self-stretch" />
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="bg-border w-px shrink-0 self-stretch" />
          <Skeleton className="h-8 w-24 shrink-0 rounded-lg md:hidden" />
          <Skeleton className="hidden h-9 w-40 shrink-0 rounded-lg md:block" />
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 px-4 pb-4 md:flex-row md:gap-6 md:px-0 md:pb-0">
        <div className="border-border bg-card h-full w-full shrink-0 space-y-4 overflow-hidden rounded-xl border p-4 shadow-lg md:w-[40%] xl:w-[30%]">
          <Skeleton className="h-7 w-1/3" />
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="space-y-1.5">
                <Skeleton
                  className={cn('h-4', row === 1 ? 'w-2/3' : 'w-1/4')}
                />
                <Skeleton className="h-9 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-border bg-muted/10 hidden min-h-0 flex-1 items-start justify-center rounded-xl border pt-8 shadow-inner md:flex">
          <Skeleton className="aspect-794/1123 w-[40%]" />
        </div>
      </div>
    </main>
  );
}
