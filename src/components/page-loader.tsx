import { Loader } from 'lucide-react';

export const PageLoader = () => {
  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <Loader className="size-6 text-muted-foreground animate-spin" />
    </div>
  );
};
