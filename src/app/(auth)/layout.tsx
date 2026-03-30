'use client'

//components
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Hooks
import { usePathname } from 'next/navigation'

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathName = usePathname()

  return (
    <main className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-screen-2xl p-4">
        <nav className="flex items-center justify-end gap-2">
          <Button
            asChild
            variant={'outline'}
            className="text-black font-semibold"
            size={'lg'}
          >
            <Link href={pathName === '/sign-in' ? '/sign-up' : '/sign-in'}>
              {pathName === '/sign-in' ? 'Sign Up' : 'Sign In'}
            </Link>
          </Button>
        </nav>
        <div className="flex flex-col w-full h-full items-center justify-center pt-8 md:pt-14">
          {children}
        </div>
      </div>
    </main>
  )
}

export default AuthLayout
