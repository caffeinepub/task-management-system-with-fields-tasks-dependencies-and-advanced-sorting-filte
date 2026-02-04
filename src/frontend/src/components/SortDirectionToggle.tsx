import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SortDirectionToggleProps {
  direction: 'asc' | 'desc';
  onToggle: () => void;
  className?: string;
}

export default function SortDirectionToggle({ direction, onToggle, className }: SortDirectionToggleProps) {
  const label = direction === 'asc' ? 'Sort ascending' : 'Sort descending';
  const Icon = direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggle}
            className={className}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
