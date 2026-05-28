import Image from 'next/image'
import Link from 'next/link'
import logo from '@/public/assets/logo.svg'
import UserButton from '@/features/auth/components/user-button'
import { getCurrent } from '@/features/auth/queries'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

interface StandaloneLayoutProps {
  children: React.ReactNode
}

const StandaloneLayout = async ({ children }: StandaloneLayoutProps) => {
  const user = await getCurrent()
  if (!user) {
    const pathname = headers().get('x-pathname') || '/';
    redirect(`/sign-in?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <main className="bg-neutral-100 dark:bg-neutral-900 min-h-screen">
      <div className="mx-auto max-w-screen-2xl p-4">
        <nav className="flex justify-between items-center h-[73px]">
          <Link href="/">
            <Image src={logo} alt="Logo" width={152} height={56} />
          </Link>
          <UserButton />
        </nav>
        <div className="flex flex-col items-center justify-center py-4 ">
          {children}
        </div>
      </div>
    </main>
  )
}

export default StandaloneLayout
