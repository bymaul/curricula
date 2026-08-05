import { GitHubLink } from '@/components/GitHubLink';
import { Separator } from '@/components/ui/separator';
import { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

export function BrandMark({
  gitHubSize = 'default',
}: {
  gitHubSize?: VariantProps<typeof buttonVariants>['size'];
}) {
  return (
    <>
      <h1 className="text-lg font-bold tracking-tight shrink-0">Curricula</h1>
      <div className="flex items-center gap-2">
        <GitHubLink size={gitHubSize} />
        <Separator orientation="vertical" />
      </div>
    </>
  );
}
