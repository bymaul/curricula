import { cn } from '@/lib/utils';

export function EditorSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="h-dvh w-full bg-background flex flex-col lg:p-6 overflow-hidden"
    >
      <div className="p-4 lg:p-0 flex items-center justify-between shrink-0 lg:mb-6">
        <div className="h-6 w-24 rounded-md bg-muted animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
          <div className="h-9 w-9 rounded-lg bg-muted animate-pulse hidden sm:block" />
          <div className="h-9 w-40 rounded-lg bg-muted animate-pulse hidden lg:block" />
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-4 lg:gap-6 px-4 pb-4 lg:px-0 lg:pb-0">
        <div className="w-full lg:w-[35%] xl:w-[30%] h-64 lg:h-full rounded-xl border border-border bg-card shadow-lg shrink-0 p-4 space-y-4 overflow-hidden">
          <div className="h-7 w-1/3 rounded-md bg-muted animate-pulse" />
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="space-y-1.5">
                <div
                  className={cn(
                    'h-4 rounded bg-muted animate-pulse',
                    row === 1 ? 'w-2/3' : 'w-1/4',
                  )}
                />
                <div className="h-9 rounded-lg bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 rounded-xl border border-border bg-muted/10 shadow-inner hidden lg:flex items-start justify-center pt-8">
          <div className="w-[40%] aspect-[794/1123] rounded-md bg-muted/50 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
