'use server'

//Helpers
import { Query } from 'node-appwrite'
import { createSessionClient } from '@/lib/appwrite'

//Constants
import { DATABASE_ID, MEMBERS_ID, WORKSPACES_ID } from '@/config'

export const getWorkspaces = async () => {
  const { account, databases } = await createSessionClient()

  const user = await account.get()

  const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
    Query.equal('userId', user.$id),
  ])

  if (member.total === 0) {
    return { data: { documents: [], total: 0 } }
  }

  const workspaceIds = member.documents.map((m) => m.workspaceId)

  const workspaces = await databases.listDocuments(
    DATABASE_ID,
    WORKSPACES_ID,
    [Query.contains('$id', workspaceIds), Query.orderDesc('$createdAt')],
  )

  return workspaces
}

