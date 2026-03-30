//Components
import { Button } from '@/components/ui/button';

//Types
import { FormatOptions } from 'date-fns';

//Icons
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface CustomToolbarProps {
  date: Date;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  format: (
    date: string | number | Date,
    formatStr: string,
    options?: FormatOptions | undefined,
  ) => string;
}

export const CustomToolbar = ({
  date,
  onNavigate,
  format,
}: CustomToolbarProps) => {
  return (
    <div className="flex mb-4 gap-x-2 items-center w-full lg:w-auto justify-center lg:justify-start ">
      <Button
        size={'icon'}
        variant={'secondary'}
        onClick={() => onNavigate('PREV')}
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      <div className="flex items-center justify-center border border-input rounded-md px-3 py-2 h-8 w-full lg:w-auto">
        <CalendarIcon className="size-4 mr-2" />
        <p className="text-sm">{format(date, 'MMMM yyyy')}</p>
      </div>
      <Button
        size={'icon'}
        variant={'secondary'}
        onClick={() => onNavigate('NEXT')}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  );
};
