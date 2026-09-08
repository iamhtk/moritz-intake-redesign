import { ArrowDown, BookMarked, PenLine, TriangleAlert } from '@repo/ui/icons';
import { Badge } from '@/components/design/foundations/components/badge';
import type { ThingToFix } from './review-data';

/**
 * One thing the QA agent wants changed. The three kinds are three different
 * asks, so each gets the shape that makes it actionable rather than a shared
 * paragraph: a rewrite shows the swap, a missing reference shows what is
 * unsupported and what would support it, and a generic note is prose because
 * that is all the agent committed to.
 */
export function ThingToFixCard({ fix }: { fix: ThingToFix }) {
  if (fix.type === 'REWRITE') {
    return (
      <FixShell icon={<PenLine />} label="Rewrite">
        <Quoted tone="current" label="Currently reads">
          {fix.currentText}
        </Quoted>
        <div
          aria-hidden="true"
          className="text-muted-foreground flex justify-center py-0.5"
        >
          <ArrowDown className="size-3.5" />
        </div>
        <Quoted tone="target" label="Should read">
          {fix.shouldBe}
        </Quoted>
      </FixShell>
    );
  }

  if (fix.type === 'MISSING_REFERENCE') {
    return (
      <FixShell icon={<BookMarked />} label="Missing reference">
        <Quoted tone="current" label="Unsupported">
          {fix.currentText}
        </Quoted>
        <p className="text-foreground pt-1 text-sm leading-relaxed">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Reference needed
          </span>
          <br />
          {fix.referenceNeeded}
        </p>
      </FixShell>
    );
  }

  return (
    <FixShell icon={<TriangleAlert />} label="To fix">
      <p className="text-foreground text-sm leading-relaxed">
        {fix.description}
      </p>
    </FixShell>
  );
}

function FixShell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-field rounded-xl border p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <Badge variant="warning">
          <span data-icon="inline-start" className="[&>svg]:size-3">
            {icon}
          </span>
          {label}
        </Badge>
      </div>
      {children}
    </div>
  );
}

/**
 * A passage of the work under discussion. Quoted rather than paraphrased so the
 * lawyer can find it in their own document by eye, and tinted so the text being
 * replaced never reads as the text to use.
 */
function Quoted({
  tone,
  label,
  children,
}: {
  tone: 'current' | 'target';
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
        {label}
      </div>
      <blockquote
        className={
          tone === 'current'
            ? 'border-l-2 border-red-500/40 bg-red-500/5 py-1.5 pl-3 pr-2 text-sm leading-relaxed text-zinc-700'
            : 'border-l-2 border-green-500/40 bg-green-500/5 py-1.5 pl-3 pr-2 text-sm leading-relaxed text-zinc-800'
        }
      >
        {children}
      </blockquote>
    </div>
  );
}
