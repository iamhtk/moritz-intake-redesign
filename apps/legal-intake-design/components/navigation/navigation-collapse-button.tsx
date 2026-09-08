'use client';

import { useNavigation } from './navigation-context';
import { ChevronLeft, ChevronRight } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';

type NavigationCollapseButtonProps = {
  collapseLabel: string;
  expandLabel: string;
};

export function NavigationCollapseButton({
  collapseLabel,
  expandLabel,
}: NavigationCollapseButtonProps) {
  const { isCollapsed, toggleCollapsed } = useNavigation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? expandLabel : collapseLabel}
          className="hover:bg-muted-foreground/10 rounded-lg"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {isCollapsed ? expandLabel : collapseLabel}
      </TooltipContent>
    </Tooltip>
  );
}
