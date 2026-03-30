import { AlertTriangle } from 'lucide-react';

interface PageErrorProps {
  message: string;
}

export const PageError = ({
  message = 'Something went wrong',
}: PageErrorProps) => {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <AlertTriangle className="size-6 text-muted-foreground mb-2" />
      <p className="text-muted-foreground text-sm font-medium">{message}</p>
    </div>
  );
};
