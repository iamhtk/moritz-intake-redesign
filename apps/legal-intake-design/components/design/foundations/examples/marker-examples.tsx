'use client';

import { toast } from 'sonner';

import {
  BookOpenCheck,
  FileText,
  GitBranch,
  RotateCcw,
  Search,
} from '@repo/ui/icons';

import {
  Marker,
  MarkerContent,
  MarkerIcon,
} from '@/components/design/foundations/components/marker';
import { Spinner } from '@/components/design/foundations/components/spinner';

/**
 * Interactive Marker demos for the foundation showcase page. Faithful ports of
 * shadcn's Marker examples, composed from the foundation primitives.
 */

export function MarkerDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Marker>
        <MarkerIcon>
          <GitBranch />
        </MarkerIcon>
        <MarkerContent>Switched to a new branch</MarkerContent>
      </Marker>
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">Thinking...</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Conversation compacted</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <Search />
        </MarkerIcon>
        <MarkerContent>Explored 4 files</MarkerContent>
      </Marker>
    </div>
  );
}

export function MarkerVariantsExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Marker>
        <MarkerContent>A default marker for inline notes.</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>A separator marker</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>A border marker for row boundaries.</MarkerContent>
      </Marker>
    </div>
  );
}

export function MarkerStatusExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Marker role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Compacting conversation</MarkerContent>
      </Marker>
      <Marker variant="separator" role="status">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Running tests</MarkerContent>
      </Marker>
    </div>
  );
}

export function MarkerShimmerExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Marker role="status">
        <MarkerContent className="shimmer">Thinking...</MarkerContent>
      </Marker>
      <Marker variant="separator" role="status">
        <MarkerContent className="shimmer">Reading 4 files</MarkerContent>
      </Marker>
    </div>
  );
}

export function MarkerSeparatorExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Worked for 42s</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Conversation compacted</MarkerContent>
      </Marker>
    </div>
  );
}

export function MarkerBorderExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Marker variant="border">
        <MarkerIcon>
          <GitBranch />
        </MarkerIcon>
        <MarkerContent>Switched to release-candidate</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <Search />
        </MarkerIcon>
        <MarkerContent>Reviewed 8 related files</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <FileText />
        </MarkerIcon>
        <MarkerContent>Opened implementation notes</MarkerContent>
      </Marker>
    </div>
  );
}

export function MarkerIconExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-12">
      <Marker>
        <MarkerIcon>
          <GitBranch />
        </MarkerIcon>
        <MarkerContent>Switched to a new branch</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerIcon>
          <Search />
        </MarkerIcon>
        <MarkerContent>Explored 4 files</MarkerContent>
      </Marker>
      <Marker className="flex-col">
        <MarkerIcon>
          <BookOpenCheck />
        </MarkerIcon>
        <MarkerContent>Syncing completed</MarkerContent>
      </Marker>
    </div>
  );
}

export function MarkerLinkButtonExample() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <Marker asChild>
        <a
          href="#links-and-buttons"
          className="hover:text-foreground transition-colors"
        >
          <MarkerIcon>
            <GitBranch />
          </MarkerIcon>
          <MarkerContent>View the pull request</MarkerContent>
        </a>
      </Marker>
      <Marker asChild>
        <button
          type="button"
          className="hover:text-foreground transition-colors"
          onClick={() => toast('You clicked the revert button')}
        >
          <MarkerIcon>
            <RotateCcw />
          </MarkerIcon>
          <MarkerContent>Revert this change</MarkerContent>
        </button>
      </Marker>
    </div>
  );
}
