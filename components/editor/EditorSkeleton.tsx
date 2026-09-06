import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function EditorSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="bg-background text-foreground flex h-dvh w-full flex-col overflow-hidden overscroll-x-none md:p-6"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 p-3 sm:p-4 md:mb-6 md:p-0">
        <Skeleton className="h-6 w-20 shrink-0 sm:h-7" />
        <div className="flex h-5 items-center gap-1.5 sm:gap-2">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="bg-border w-px shrink-0 self-stretch" />
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="bg-border hidden w-px shrink-0 self-stretch md:inline-flex" />
          <Skeleton className="hidden h-8 w-40 shrink-0 rounded-lg md:block" />
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 px-4 pb-4 md:flex-row md:gap-6 md:px-0 md:pb-0">
        <div className="border-border bg-card @container/sidebar flex h-full w-full shrink-0 flex-col overflow-hidden rounded-xl border shadow-lg md:w-[40%] xl:w-[30%]">
          <div className="min-h-0 flex-1 space-y-4 px-4 pt-4 pb-6">
            <div>
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="mt-1 h-4 w-2/3" />
            </div>
            <div className="space-y-4">
              {[0, 1, 2].map((row) => (
                <div key={row} className="space-y-1.5">
                  <Skeleton
                    className={cn('h-4', row === 1 ? 'w-2/3' : 'w-1/4')}
                  />
                  <Skeleton className="h-8 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-border bg-muted/30 flex h-14 shrink-0 items-stretch overflow-hidden border-t">
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <Skeleton className="h-4 w-12 shrink-0" />
              <Skeleton className="h-4 w-16 shrink-0" />
              <Skeleton className="hidden h-4 w-20 shrink-0 sm:block" />
              <Skeleton className="hidden h-4 w-14 shrink-0 sm:block" />
            </div>
            <Skeleton className="border-border h-full w-12 shrink-0 rounded-none border-0 border-l" />
          </div>

          <div className="border-border bg-muted/30 flex shrink-0 items-center justify-between gap-2 border-t px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
              <Skeleton className="hidden h-4 w-24 shrink-0 sm:block" />
            </div>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map((icon) => (
                <Skeleton
                  key={icon}
                  className={cn(
                    'h-8 w-8 shrink-0 rounded-lg',
                    icon === 2 && 'md:hidden',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="border-border bg-muted/10 relative hidden min-h-0 flex-1 items-start justify-center overflow-hidden rounded-xl border pt-8 shadow-inner md:flex">
          <Skeleton className="absolute top-3 left-3 h-7 w-20 rounded-lg" />
          <Skeleton className="aspect-794/1123 w-[40%]" />
          <Skeleton className="absolute right-3 bottom-3 h-[34px] w-40 rounded-lg" />
        </div>
      </div>
    </main>
  );
}
