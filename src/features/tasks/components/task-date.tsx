import { cn } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';

interface TaskDateProps {
  value: string;
  className?: string;
}

export const TaskDate = ({ value, className }: TaskDateProps) => {
  const daysLeft = differenceInDays(new Date(value), new Date());

  let textColor = 'text-muted-foreground';

  if (daysLeft <= 3) {
    textColor = 'text-red-500';
  } else if (daysLeft <= 7) {
    textColor = 'text-orange-500';
  } else if (daysLeft <= 14) {
    textColor = 'text-yellow-500';
  }

  return (
    <div className={cn(className)}>
      <span className={cn(textColor, 'truncate')}>{format(value, 'PPP')}</span>
    </div>
  );
};
