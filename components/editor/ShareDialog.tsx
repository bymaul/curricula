'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { buildShareUrl } from '@/lib/share';
import { CVData } from '@/lib/schema';
import { Check, Copy, ExternalLink, Loader2, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvData: CVData;
}

function ShareLinkContent({ cvData }: { cvData: CVData }) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void buildShareUrl(cvData).then((url) => {
      if (!cancelled) setLink(url);
    });
    return () => {
      cancelled = true;
    };
  }, [cvData]);

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.add({
        type: 'success',
        description: 'Share link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.add({
        type: 'error',
        description: 'Could not copy the link. Select it manually.',
        priority: 'high',
      });
    }
  };

  if (!link) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Building share link…
      </div>
    );
  }

  return (
    <>
      <textarea
        readOnly
        value={link}
        aria-label="Share link"
        className="h-24 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-xs break-all leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={handleCopy} disabled={copied}>
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <Button onClick={() => window.open(link, '_blank')}>
          <ExternalLink className="w-4 h-4" />
          Open
        </Button>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Share2 className="w-3.5 h-3.5 shrink-0" />
        The link can be long for detailed CVs.
      </p>
    </>
  );
}

export function ShareDialog({ open, onOpenChange, cvData }: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share CV</DialogTitle>
          <DialogDescription>
            Anyone with this link can open this CV in Curricula. Your data is
            encoded in the link itself and never leaves the browser.
          </DialogDescription>
        </DialogHeader>

        {open && <ShareLinkContent cvData={cvData} />}
      </DialogContent>
    </Dialog>
  );
}
