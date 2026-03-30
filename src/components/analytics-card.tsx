//Components
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

//Icons
import { FaCaretUp, FaCaretDown } from 'react-icons/fa';

//Utils
import { cn } from '@/lib/utils';

interface AnalyticsCardProps {
  title: string;
  value: number;
  variant: 'up' | 'down';
  increaseValue: number;
}

export const AnalyticsCard = ({
  title,
  value,
  variant,
  increaseValue,
}: AnalyticsCardProps) => {
  const iconColor = variant === 'up' ? 'text-emerald-500' : 'text-red-500';
  const increaseValueColor =
    variant === 'up' ? 'text-emerald-500' : 'text-red-500';
  const Icon = variant === 'up' ? FaCaretUp : FaCaretDown;

  return (
    <Card className="shadow-none border-none w-full">
      <CardHeader>
        <div className="flex items-center gap-x-2">
          <CardDescription className="flex items-center gap-x-2 font-medium overflow-hidden">
            <span className="truncate text-base">{title}</span>
          </CardDescription>
          <div className="flex items-center gap-x-1">
            <Icon className={cn('size-4', iconColor)} />
            <span
              className={cn(
                'text-base font-medium truncate',
                increaseValueColor,
              )}
            >
              {increaseValue}
            </span>
          </div>
        </div>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
};
