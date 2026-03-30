import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/query-provider';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Tamana',
  description: 'Manage your tasks and projects',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(montserrat.className, 'antialiased min-h-screen')}>
        <QueryProvider>
          <Toaster />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
