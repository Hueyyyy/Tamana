import { Hono } from "hono";

//Configs
import { DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID, TASKS_ID } from "@/config";

//Libs
import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ID, Query } from "node-appwrite";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

//Utils
import { getMember } from "@/features/members/utils";

//Types
import { Project } from "../type";
import { TaskStatus } from "@/features/tasks/types";

//Schemas
import { createProjectSchema, updateProjectSchema } from "../schemas";

const app = new Hono()
    .get('/', sessionMiddleware, zValidator('query', z.object({
        workspaceId: z.string(),
    })), async (c) => {
        const { workspaceId } = c.req.valid('query')
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

        const projects = await databases.listDocuments<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            [Query.equal('workspaceId', workspaceId), Query.orderDesc('$createdAt')]
        )

        return c.json({data: projects})
    })
    .get('/:projectId', sessionMiddleware, async (c) => {
        const { projectId } = c.req.param()
        
        const user = c.get('user')
        const databases = c.get('databases')

        
        if (!projectId) {
          return c.json({error: 'Project ID is required'}, 400)
        }
        
        const project = await databases.getDocument<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            projectId,
          )
        
        if (!project) {
          return c.json({error: 'Project not found'}, 404)
        }
        
        const member = await getMember({
            databases,
            workspaceId: project.workspaceId,
            userId: user.$id
        })

        if (!member) {
            return c.json({error: 'Unauthorized'}, 401)
        }

        return c.json({data: project})
    })
    .get('/:projectId/analytics', sessionMiddleware, async (c) => {
        const { projectId } = c.req.param()
        
        const user = c.get('user')
        const databases = c.get('databases')

        
        if (!projectId) {
          return c.json({error: 'Project ID is required'}, 400)
        }
        
        const project = await databases.getDocument<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            projectId,
          )
        
        if (!project) {
          return c.json({error: 'Project not found'}, 404)
        }
        
        const member = await getMember({
            databases,
            workspaceId: project.workspaceId,
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
                    Query.equal('projectId', project.$id),
                    Query.between('$createdAt', thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
                    Query.isNull('parentId'),
                ],
            ),
            databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal('projectId', project.$id),
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
                    Query.equal('projectId', project.$id),
                    Query.equal('assigneeId', member.$id),
                    Query.between('$createdAt', thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
                    Query.isNull('parentId'),
                ],
            ),
            databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal('projectId', project.$id),
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
                    Query.equal('projectId', project.$id),
                    Query.notEqual('status',TaskStatus.DONE),
                    Query.between('$createdAt', thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
                    Query.isNull('parentId'),
                ],
            ),
            databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal('projectId', project.$id),
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
                    Query.equal('projectId', project.$id),
                    Query.equal('status',TaskStatus.DONE),
                    Query.between('$createdAt', thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
                    Query.isNull('parentId'),
                ],
            ),
            databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal('projectId', project.$id),
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
                    Query.equal('projectId', project.$id),
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
                    Query.equal('projectId', project.$id),
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
    .post('/', sessionMiddleware, zValidator('form', createProjectSchema), async (c) => {
        const { name, image, workspaceId } = c.req.valid('form')
        const user = c.get('user')
        const databases = c.get('databases')
        const storage = c.get('storage')

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

        const project = await databases.createDocument(
            DATABASE_ID,
            PROJECTS_ID,
            'unique()',
            {
                name,
                imageUrl: imageUrl,
                workspaceId,
            }
        )

        return c.json({data: project})
    })
    .patch(
        '/:projectId',
        zValidator('form', updateProjectSchema),
        sessionMiddleware,
        async (c) => {
          const databases = c.get('databases')
          const storage = c.get('storage')
          const user = c.get('user')
    
          const { projectId } = c.req.param()
          const { name, image } = c.req.valid('form')

          const project = await databases.getDocument<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            projectId,
          )
    
          const member = await getMember({
            userId: user.$id,
            workspaceId: project.workspaceId,
            databases,
          })
    
          if (!member) {
            return c.json({ error: 'Unauthorized' }, 401)
          }
    
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
          } else {
            imageUrl = image
          }
    
          const updatedProject = await databases.updateDocument(
            DATABASE_ID,
            PROJECTS_ID,
            projectId,
            {
              name,
              imageUrl: imageUrl,
            },
          )
    
          return c.json({ data: updatedProject })
        },
      )
    .delete('/:projectId', sessionMiddleware, async (c) => {
        const databases = c.get('databases')
        const user = c.get('user')
    
        const { projectId } = c.req.param()

        const project = await databases.getDocument<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            projectId,
          )
    
        const member = await getMember({
          databases,
          userId: user.$id,
          workspaceId: project.workspaceId,
        })
    
        if (!member) {
          return c.json({ error: 'Unauthorized' }, 401)
        }

        const tasks = await databases.listDocuments(
            DATABASE_ID,
            TASKS_ID,
            [Query.equal('projectId', projectId)]
        )

        await Promise.all(
            tasks.documents.map((task) => databases.deleteDocument(DATABASE_ID, TASKS_ID, task.$id))
        )
    
        await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId)
    
        return c.json({
          data: {
            $id: projectId,
          },
        })
      })

export default app