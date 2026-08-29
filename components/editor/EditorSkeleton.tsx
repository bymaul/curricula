import { cn } from '@/lib/utils';

export function EditorSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="bg-background flex h-dvh w-full flex-col overflow-hidden lg:p-6"
    >
      <div className="flex shrink-0 items-center justify-between p-4 lg:mb-6 lg:p-0">
        <div className="bg-muted h-6 w-24 animate-pulse rounded-md" />
        <div className="flex items-center gap-2">
          <div className="bg-muted h-9 w-9 animate-pulse rounded-lg" />
          <div className="bg-muted hidden h-9 w-40 animate-pulse rounded-lg lg:block" />
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 px-4 pb-4 lg:flex-row lg:gap-6 lg:px-0 lg:pb-0">
        <div className="border-border bg-card h-full w-full shrink-0 space-y-4 overflow-hidden rounded-xl border p-4 shadow-lg lg:w-[35%] xl:w-[30%]">
          <div className="bg-muted h-7 w-1/3 animate-pulse rounded-md" />
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="space-y-1.5">
                <div
                  className={cn(
                    'bg-muted h-4 animate-pulse rounded',
                    row === 1 ? 'w-2/3' : 'w-1/4',
                  )}
                />
                <div className="bg-muted/60 h-9 animate-pulse rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-border bg-muted/10 hidden min-h-0 flex-1 items-start justify-center rounded-xl border pt-8 shadow-inner lg:flex">
          <div className="bg-muted/50 aspect-[794/1123] w-[40%] animate-pulse rounded-md" />
        </div>
      </div>
    </main>
  );
}
