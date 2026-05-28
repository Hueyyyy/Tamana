import { Hono } from 'hono'

//Libs
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sessionMiddleware } from '@/lib/session-middleware'
import { ID, Query } from 'node-appwrite'

//Schemas
import { createWorkspaceSchema, updateWorkspaceSchema } from '../schemas'

//Config
import {
  DATABASE_ID,
  IMAGES_BUCKET_ID,
  MEMBERS_ID,
  PROJECTS_ID,
  TASKS_ID,
  WORKSPACES_ID,
} from '@/config'

//Types
import { MemberRole } from '@/features/members/type'
import { Workspace } from '../type'
import { TaskStatus } from '@/features/tasks/types'

//Utils
import { generateInviteCode } from '@/lib/utils'
import { getMember } from '@/features/members/utils'
import { endOfMonth, startOfMonth, subMonths } from 'date-fns'

const app = new Hono()
  .get('/', sessionMiddleware, async (c) => {
    const databases = c.get('databases')
    const user = c.get('user')

    const member = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
      Query.equal('userId', user.$id),
    ])

    if (member.total === 0) {
      return c.json({ data: { documents: [], total: 0 } })
    }

    const workspaceIds = member.documents.map((m) => m.workspaceId)

    const workspaces = await databases.listDocuments(
      DATABASE_ID,
      WORKSPACES_ID,
      [Query.contains('$id', workspaceIds), Query.orderDesc('$createdAt')],
    )
    return c.json({ data: workspaces })
  })
  .get('/:workspaceId', sessionMiddleware, async (c) => {
    const databases = c.get('databases')
    const user = c.get('user')

    const { workspaceId } = c.req.param()

    const member = await getMember({
      databases,
      userId: user.$id,
      workspaceId,
    })

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const workspace = await databases.getDocument<Workspace>(
      DATABASE_ID,
      WORKSPACES_ID,
      workspaceId,
    )

    return c.json({ data: workspace })
  })
  .get('/:workspaceId/info', sessionMiddleware, async (c) => {
    const databases = c.get('databases')

    const { workspaceId } = c.req.param()

    const workspace = await databases.getDocument<Workspace>(
      DATABASE_ID,
      WORKSPACES_ID,
      workspaceId,
    )

    return c.json({
      data: {
        $id: workspace.$id,
        name: workspace.name,
        imageUrl: workspace.imageUrl,
      },
    })
  })
  .get('/:workspaceId/analytics', sessionMiddleware, async (c) => {
          const { workspaceId } = c.req.param()
          
          const user = c.get('user')
          const databases = c.get('databases')
  
          
          if (!workspaceId) {
            return c.json({error: 'Workspace ID is required'}, 400)
          }
          
          const member = await getMember({
              databases,
              workspaceId,
              userId: user.$id
          })
  
          if (!member) {
              return c.json({error: 'Unauthorized'}, 401)
          }
  
          const now = new Date();
          const thisMonthStart = startOfMonth(now);
          const thisMonthEnd = endOfMonth(now);
          const lastMonthStart = startOfMonth(subMonths(now, 1));
          const lastMonthEnd = endOfMonth(subMonths(now, 1));
  
          //Get all tasks in the current month and last month
          const [thisMonthTasks, lastMonthTasks] = await Promise.all([
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.between('$createdAt', thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.between('$createdAt', lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
          ])
  
          const taskCount = thisMonthTasks.total
          const taskCountDifference = thisMonthTasks.total - lastMonthTasks.total;
          
          //Get all tasks assigned to the current member in the current month and last month
          const [thisMonthAssignedTasks, lastMonthAssignedTasks] = await Promise.all([
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.equal('assigneeId', member.$id),
                      Query.between('$createdAt', thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.equal('assigneeId', member.$id),
                      Query.between('$createdAt', lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
          ])
  
          const assignedTasksCount = thisMonthAssignedTasks.total
          const assignedTasksCountDifference = thisMonthAssignedTasks.total - lastMonthAssignedTasks.total;
  
          //Get all tasks that are not done in the current month and last month
          const [thisMonthIncompleteTasks, lastMonthIncompleteTasks] = await Promise.all([
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.notEqual('status',TaskStatus.DONE),
                      Query.between('$createdAt', thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.notEqual('status',TaskStatus.DONE),
                      Query.between('$createdAt', lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
          ])
  
          const incompleteTasksCount = thisMonthIncompleteTasks.total
          const incompleteTasksCountDifference = thisMonthIncompleteTasks.total - lastMonthIncompleteTasks.total;
  
          //Get all tasks that are done in the current month and last month
          const [thisMonthCompletedTasks, lastMonthCompletedTasks] = await Promise.all([
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.equal('status',TaskStatus.DONE),
                      Query.between('$createdAt', thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.equal('status',TaskStatus.DONE),
                      Query.between('$createdAt', lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
          ])
  
          const completedTasksCount = thisMonthCompletedTasks.total
          const completedTasksCountDifference = thisMonthCompletedTasks.total - lastMonthCompletedTasks.total;
  
          //Get all tasks that are overdue in the current month and last month
          const [thisMonthOverdueTasks, lastMonthOverdueTasks] = await Promise.all([
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.notEqual('status',TaskStatus.DONE),
                      Query.lessThan('dueDate', now.toISOString()),
                      Query.between('$createdAt', thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
              databases.listDocuments(
                  DATABASE_ID,
                  TASKS_ID,
                  [
                      Query.equal('workspaceId', workspaceId),
                      Query.notEqual('status',TaskStatus.DONE),
                      Query.lessThan('dueDate', now.toISOString()),
                      Query.between('$createdAt', lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
                      Query.isNull('parentId'),
                  ],
              ),
          ])
  
          const overdueTasksCount = thisMonthOverdueTasks.total
          const overdueTasksCountDifference = thisMonthOverdueTasks.total - lastMonthOverdueTasks.total;
  
          return c.json({data: {
            taskCount,
            taskCountDifference,
            assignedTasksCount,
            assignedTasksCountDifference,
            incompleteTasksCount,
            incompleteTasksCountDifference,
            completedTasksCount,
            completedTasksCountDifference,
            overdueTasksCount,
            overdueTasksCountDifference
          }})
      })
  .post(
    '/',
    zValidator('form', createWorkspaceSchema),
    sessionMiddleware,
    async (c) => {
      const databases = c.get('databases')
      const storage = c.get('storage')
      const user = c.get('user')

      const { name, image } = c.req.valid('form')

      let imageUrl: string | undefined

      if (image instanceof File) {
        const fileResponse = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image,
        )

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          fileResponse.$id,
        )

        imageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString(
          'base64',
        )}`
      }

      const workspace = await databases.createDocument(
        DATABASE_ID,
        WORKSPACES_ID,
        ID.unique(),
        {
          name,
          imageUrl: imageUrl,
          inviteCode: generateInviteCode(10),
        },
      )

      await databases.createDocument(DATABASE_ID, MEMBERS_ID, ID.unique(), {
        userId: user.$id,
        workspaceId: workspace.$id,
        role: MemberRole.ADMIN,
        isOwner: true,
      })

      return c.json({ data: workspace })
    },
  )
  .patch(
    '/:workspaceId',
    zValidator('form', updateWorkspaceSchema),
    sessionMiddleware,
    async (c) => {
      const databases = c.get('databases')
      const storage = c.get('storage')
      const user = c.get('user')

      const { workspaceId } = c.req.param()
      const { name, image } = c.req.valid('form')

      const member = await getMember({
        userId: user.$id,
        workspaceId,
        databases,
      })

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: 'Unauthorized' }, 401)
      }

      let imageUrl: string | null

      if (image instanceof File) {
        const fileResponse = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image,
        )

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          fileResponse.$id,
        )

        imageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString(
          'base64',
        )}`
      } else {
        imageUrl = null
      }


      const updatedWorkspace = await databases.updateDocument(
        DATABASE_ID,
        WORKSPACES_ID,
        workspaceId,
        {
          name,
          imageUrl: imageUrl,
        },
      )

      

      return c.json({ data: updatedWorkspace })
    },
  )
  .delete('/:workspaceId', sessionMiddleware, async (c) => {
    const databases = c.get('databases')
    const user = c.get('user')

    const { workspaceId } = c.req.param()

    const member = await getMember({
      databases,
      userId: user.$id,
      workspaceId,
    })

    if (!member || !member.isOwner) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const projects = await databases.listDocuments(
      DATABASE_ID,
      PROJECTS_ID,
      [Query.equal('workspaceId', workspaceId)],
    )

    await Promise.all(
      projects.documents.map((project) => databases.deleteDocument(DATABASE_ID, PROJECTS_ID, project.$id)),
    )

    const tasks = await databases.listDocuments(
      DATABASE_ID,
      TASKS_ID,
      [Query.equal('workspaceId', workspaceId)],
    )

    await Promise.all(
      tasks.documents.map((task) => databases.deleteDocument(DATABASE_ID, TASKS_ID, task.$id)),
    )

    const members = await databases.listDocuments(
      DATABASE_ID,
      MEMBERS_ID,
      [Query.equal('workspaceId', workspaceId)],
    )

    await Promise.all(
      members.documents.map((member) => databases.deleteDocument(DATABASE_ID, MEMBERS_ID, member.$id)),
    )

    await databases.deleteDocument(DATABASE_ID, WORKSPACES_ID, workspaceId)

    return c.json({
      data: {
        $id: workspaceId,
      },
    })
  })
  .post('/:workspaceId/reset-invite-code', sessionMiddleware, async (c) => {
    const databases = c.get('databases')
    const user = c.get('user')

    const { workspaceId } = c.req.param()

    const member = await getMember({
      databases,
      userId: user.$id,
      workspaceId,
    })

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const workspace = await databases.updateDocument(
      DATABASE_ID,
      WORKSPACES_ID,
      workspaceId,
      {
        inviteCode: generateInviteCode(10),
      },
    )

    return c.json({
      data: workspace,
    })
  })
  .post(
    '/:workspaceId/join',
    sessionMiddleware,
    zValidator('json', z.object({ inviteCode: z.string() })),
    async (c) => {
      const databases = c.get('databases')
      const user = c.get('user')

      const { workspaceId } = c.req.param()
      const { inviteCode } = c.req.valid('json')

      const member = await getMember({
        databases,
        userId: user.$id,
        workspaceId,
      })

      if (member) {
        return c.json({ error: 'Already a member' }, 400)
      }

      const workspace = await databases.getDocument<Workspace>(
        DATABASE_ID,
        WORKSPACES_ID,
        workspaceId,
      )

      if (workspace.inviteCode !== inviteCode) {
        return c.json({ error: 'Invalid invite code' }, 400)
      }

      await databases.createDocument(DATABASE_ID, MEMBERS_ID, ID.unique(), {
        userId: user.$id,
        workspaceId,
        role: MemberRole.MEMBER,
        isOwner: false,
      })

      return c.json({ data: workspace })
    },
  )

export default app
