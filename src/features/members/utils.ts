import { Query, type Databases } from 'node-appwrite'
import { DATABASE_ID, MEMBERS_ID } from '@/config'
import { Member } from './type'

interface GetMemberParams {
  userId: string
  workspaceId: string
  databases: Databases
}

export const getMember = async ({
  userId,
  workspaceId,
  databases,
}: GetMemberParams) => {
  const member = await databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
    Query.equal('userId', userId),
    Query.equal('workspaceId', workspaceId),
  ])

  return member.total > 0 ? member.documents[0] : null
}
