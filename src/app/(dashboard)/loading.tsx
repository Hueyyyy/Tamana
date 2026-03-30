import { Loader } from 'lucide-react';

const LoadingPage = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <Loader className="size-6 animate-spin text-muted-foreground" />
      <h1 className="text-lg font-semibold text-muted-foreground">
        Loading...
      </h1>
    </div>
  );
};

export default LoadingPage;
