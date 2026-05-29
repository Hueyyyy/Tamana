import { Hono } from 'hono'

import {
    DATABASE_ID,
    MEMBERS_ID,
    WORKSPACES_ID,
    NOTIFICATIONS_ID,
    IMAGES_BUCKET_ID,
} from '@/config'

//Libs
import { ID } from 'node-appwrite'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sessionMiddleware } from '@/lib/session-middleware'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite'
import { getMember } from '../utils'
import { Member, MemberRole } from '../type'
import { NotificationType } from '@/features/notifications/types'
import { sendEmailNotification } from '@/features/notifications/utils'

const app = new Hono()
    .get('/', sessionMiddleware, zValidator('query', z.object({ workspaceId: z.string() })), async (c) => {
        const { workspaceId } = c.req.valid('query')
        const { users } = await createAdminClient()
        const databases = c.get('databases')
        const user = c.get('user')

        const member = await getMember({
            databases,
            workspaceId,
            userId: user.$id
        })

        if (!member) {
            return c.json ({error: 'Unauthorized'}, 401)
        }

        const members = await databases.listDocuments<Member>(
            DATABASE_ID,
            MEMBERS_ID,
            [Query.equal('workspaceId',workspaceId)]
        );

        const storage = c.get('storage')
        const populatedMembers = await Promise.all(
            members.documents.map (async (member) => {
                const user = await users.get(member.userId)
                const imageId = user.prefs?.imageId
                let avatarUrl: string | undefined
                if (imageId) {
                    try {
                        const arrayBuffer = await storage.getFilePreview(
                            IMAGES_BUCKET_ID,
                            imageId,
                        )
                        avatarUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`
                    } catch (error) {
                        console.error("Failed to get member file preview:", error)
                    }
                }
                return {
                    ...member,
                    name: user.name || user.email,
                    email: user.email,
                    avatarUrl
                }
            })
        )

        return c.json ({data: {...members, documents: populatedMembers}})
    })
    .get('/memberinfo', sessionMiddleware, zValidator('query', z.object({ workspaceId: z.string(), userId: z.string() })) , async (c) => {
        const { workspaceId, userId } = c.req.valid('query');
        const databases = c.get('databases');
        const { users } = await createAdminClient();

        const member = await getMember({
            databases,
            workspaceId: workspaceId,
            userId: userId
        })

        if (!member) {
            return c.json({error: 'Unauthorized'}, 401)
        }

        const user = await users.get(userId);
        const imageId = user.prefs?.imageId;
        let avatarUrl: string | undefined
        if (imageId) {
            try {
                const storage = c.get('storage');
                const arrayBuffer = await storage.getFilePreview(
                    IMAGES_BUCKET_ID,
                    imageId,
                )
                avatarUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`
            } catch (error) {
                console.error("Failed to get memberinfo file preview:", error)
            }
        }

        return c.json({
            data: {
                ...member,
                name: user.name || user.email,
                email: user.email,
                avatarUrl
            }
        })
    })
    .delete('/:memberId', sessionMiddleware, async (c) => {
        const { memberId } = c.req.param();
        const user = c.get('user');
        const databases = c.get('databases');

        const memberToDelete = await databases.getDocument(
            DATABASE_ID,
            MEMBERS_ID,
            memberId
        );

        const allMembersInWorkspace = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [Query.equal('workspaceId', memberToDelete.workspaceId)]
        );

        const member = await getMember({
            databases,
            workspaceId: memberToDelete.workspaceId,
            userId: user.$id
        })

        if (!member) {
            return c.json({error: 'Unauthorized'}, 401)
        }

        if (memberToDelete.isOwner) {
            return c.json({error: 'Cannot delete owner'}, 400)
        }

        if (member.role !== MemberRole.ADMIN && member.$id !== memberToDelete.$id) {
            return c.json({error: 'Unauthorized'}, 401)
        }

        if (member.role === MemberRole.ADMIN && allMembersInWorkspace.total <= 1) {
            return c.json({error: 'Cannot delete last member'}, 400)
        }

        await databases.deleteDocument(
            DATABASE_ID,
            MEMBERS_ID,
            memberId
        );

        // Notify the user they have been removed
        if (memberToDelete.userId !== user.$id) {
            const workspace = await databases.getDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                memberToDelete.workspaceId
            );

            await databases.createDocument(
                DATABASE_ID,
                NOTIFICATIONS_ID,
                ID.unique(),
                {
                    userId: memberToDelete.userId,
                    workspaceId: memberToDelete.workspaceId,
                    title: 'Removed from workspace',
                    message: `You have been removed from workspace: ${workspace.name}`,
                    type: NotificationType.MEMBER_REMOVED,
                    targetId: memberToDelete.workspaceId,
                    isRead: false,
                }
            );

            await sendEmailNotification({
                userId: memberToDelete.userId,
                title: 'Removed from workspace',
                message: `You have been removed from workspace: ${workspace.name}`,
            });
        }

        return c.json({ data: {
            success: true,
            $id: memberId
        }})
    })
    .patch('/:memberId', sessionMiddleware, zValidator('json', z.object({role: z.nativeEnum(MemberRole)})), async (c) => {
        const { memberId } = c.req.param();
        const { role } = c.req.valid('json');
        const user = c.get('user');
        const databases = c.get('databases');

        const memberToUpdate = await databases.getDocument(
            DATABASE_ID,
            MEMBERS_ID,
            memberId
        );

        const member = await getMember({
            databases,
            workspaceId: memberToUpdate.workspaceId,
            userId: user.$id
        })

        const allMembersInWorkspace = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [Query.equal('workspaceId', memberToUpdate.workspaceId)]
        );

        const allAdminsInWorkspace = allMembersInWorkspace.documents.filter((member) => member.role === MemberRole.ADMIN);

        if (!member) {
            return c.json({error: 'Unauthorized'}, 401)
        }

        if (member.role !== MemberRole.ADMIN) {
            return c.json({error: 'Unauthorized'}, 401)
        }

        if (memberToUpdate.isOwner) {
            return c.json({error: 'Cannot update owner'}, 400)
        }

        if (member.role === MemberRole.ADMIN && allMembersInWorkspace.total <= 1 && role !== MemberRole.ADMIN) {
            return c.json({error: 'Cannot downgrade the last member'}, 400)
        }

        if (member.role === MemberRole.ADMIN && role !== MemberRole.ADMIN && allAdminsInWorkspace.length === 1) {
            return c.json({error: 'Cannot downgrade the last admin'}, 400)
        }

        await databases.updateDocument(
            DATABASE_ID,
            MEMBERS_ID,
            memberId,
            {
                role
            }
        );

        // Notify the user their role has changed
        if (role !== memberToUpdate.role) {
            const workspace = await databases.getDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                memberToUpdate.workspaceId
            );

            const title = role === MemberRole.ADMIN ? 'Role Upgraded' : 'Role Downgraded';
            const message = `Your role has been changed to ${role} in workspace: ${workspace.name}`;

            await databases.createDocument(
                DATABASE_ID,
                NOTIFICATIONS_ID,
                ID.unique(),
                {
                    userId: memberToUpdate.userId,
                    workspaceId: memberToUpdate.workspaceId,
                    title,
                    message,
                    type: NotificationType.MEMBER_ROLE_CHANGED,
                    targetId: memberToUpdate.workspaceId,
                    isRead: false,
                }
            );

            await sendEmailNotification({
                userId: memberToUpdate.userId,
                title,
                message,
            });
        }

        return c.json({ data: {
            success: true,
            $id: memberId,
        }})
    })

export default app;