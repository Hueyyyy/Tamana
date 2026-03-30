'use client';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const ErrorPage = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <AlertTriangle className="size-6 text-red-500 " />
      <h1 className="text-lg font-semibold text-muted-foreground">
        Something went wrong!
      </h1>
      <Button variant={'secondary'} size={'sm'} asChild>
        <Link href={'/'}>Go back to home</Link>
      </Button>
    </div>
  );
};

export default ErrorPage;
