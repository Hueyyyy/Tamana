// Hooks
import { getWorkspaces } from '@/features/workspaces/queries'

//Helpers
import { redirect } from 'next/navigation'

export default async function Home() {
  const workspaces = await getWorkspaces()

  const data = 'data' in workspaces ? workspaces.data : workspaces

  if (data.total === 0) {
    redirect('/workspaces/create')
  } else {
    redirect(`/workspaces/${data.documents[0].$id}`)
  }
}
