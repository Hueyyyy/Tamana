import { getCurrent } from '@/features/auth/queries'
import SignInCard from '@/features/auth/components/SignInCard'
import { redirect } from 'next/navigation'

interface SignInPageProps {
  searchParams: {
    next?: string
  }
}

const SignInPage = async ({ searchParams }: SignInPageProps) => {
  const user = await getCurrent()

  if (user) redirect(searchParams.next || '/')

  return <SignInCard />
}

// Sign in page component
export default SignInPage;
