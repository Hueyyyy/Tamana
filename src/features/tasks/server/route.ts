import { Hono } from "hono";

// middleware
import { sessionMiddleware } from "@/lib/session-middleware";

// node-appwrite
import { ID, Query } from "node-appwrite";

// zod
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// schemas
import { createTaskSchema } from "../schemas";

// utils
import { getMember } from "@/features/members/utils";

// types
import { Task, TaskStatus } from "../types";

// config
import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID, NOTIFICATIONS_ID } from "@/config";
import { createAdminClient } from "@/lib/appwrite";
import { Project } from "@/features/projects/type";
import { NotificationType } from "@/features/notifications/types";

const app = new Hono()
    .delete('/:taskId', sessionMiddleware, async (c) => {
        const user = c.get('user')
        const databases = c.get('databases')
        const { taskId } = c.req.param()

        const task = await databases.getDocument<Task>(
            DATABASE_ID,
            TASKS_ID,
            taskId
        )

        console.log (task)

        const member = await getMember({
            userId: user.$id,
            workspaceId: task.workspaceId,
            databases
        })

        if(!member) {
            return c.json({
                error: 'Unauthorized'
            }, 401)
        }

        await databases.deleteDocument(
            DATABASE_ID,
            TASKS_ID,
            taskId
        )

        return c.json({
            data: {
                $id: task.$id
            }
        })
    })
    .get('/', sessionMiddleware, zValidator('query', z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.nativeEnum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish(),      
    })), async (c) => {
        const { users } = await createAdminClient()
        const user = c.get('user')
        const databases = c.get('databases')
        const {workspaceId, projectId, assigneeId, status, search, dueDate} = c.req.valid('query')

        const member = await getMember({
            userId: user.$id,
            workspaceId,
            databases
        })

        if(!member) {
            return c.json({
                error: 'Unauthorized'
            }, 401)
        }
        
        const query = [
            Query.equal('workspaceId', workspaceId),
            Query.orderDesc('$createdAt'),
        ]

        if(projectId){
            query.push(Query.equal('projectId', projectId))
        } 

        if(assigneeId){
            query.push(Query.equal('assigneeId', assigneeId))
        }
        
        if(status){
            query.push(Query.equal('status', status))
        }
        
        if(dueDate){
            query.push(Query.equal('dueDate', dueDate))
        }
        
        if(search){
            query.push(Query.search('name', search))
        }

        const tasks = await databases.listDocuments<Task>(
            DATABASE_ID,
            TASKS_ID,
            query
        )

        const projectIds = tasks.documents.map((task) => task.projectId)
        const assigneeIds = tasks.documents.map((task) => task.assigneeId)

        const projects = await databases.listDocuments<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            projectIds.length > 0 ? [Query.equal('$id', projectIds)] : []
        )

        const members = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            assigneeIds.length > 0 ? [Query.equal('$id', assigneeIds)] : []
        )

        const assignees = await Promise.all(
            members.documents.map (async (member) => {
                const user = await users.get(member.userId)
                return {
                    ...member,
                    name: user.name,
                    email: user.email
                }
            })
        )

        const populatedTasks = tasks.documents.map((task) => {
            const project = projects.documents.find((project) => project.$id === task.projectId)
            const assignee = assignees.find((assignee) => assignee.$id === task.assigneeId)

            return {
                ...task,
                project,
                assignee
            }
        })

        return c.json({
            data: {
                ...tasks,
                documents: populatedTasks
            }
        })
    })
    .get('/:taskId', sessionMiddleware, async (c) => {
        const { users } = await createAdminClient()
        const currentUser = c.get('user')
        const databases = c.get('databases')
        const {taskId} = c.req.param()

        const task = await databases.getDocument<Task>(
            DATABASE_ID,
            TASKS_ID,
            taskId
        )

        const currentMember = await getMember({
            userId: currentUser.$id,
            workspaceId: task.workspaceId,
            databases
        })

        if(!currentMember) {
            return c.json({
                error: 'Unauthorized'
            }, 401)
        }

        const project = await databases.getDocument<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            task.projectId
        )

        const assigneeMember = await databases.getDocument(
            DATABASE_ID,
            MEMBERS_ID,
            task.assigneeId
        )

        const assigneeUser = await users.get(assigneeMember.userId)

        const assignee = {
            ...assigneeMember,
            name: assigneeUser.name || assigneeUser.email,
            email: assigneeUser.email
        }

        return c.json({
            data: {
                ...task,
                project,
                assignee
            }
        })
    })
    .post('/', sessionMiddleware, zValidator('json', createTaskSchema), async (c) => {
        const user = c.get('user')
        const databases = c.get('databases')
        const {name, description, status, assigneeId, dueDate, projectId, workspaceId} = c.req.valid('json')

        const member = await getMember({
            userId: user.$id,
            workspaceId,
            databases
        })

        if(!member) {
            return c.json({
                error: 'Unauthorized'
            }, 401)
        }

        const highestPositionTask = await databases.listDocuments(
            DATABASE_ID,
            TASKS_ID,
            [
                Query.equal('projectId', projectId),
                Query.equal('workspaceId', workspaceId),
                Query.equal('status', status),
                Query.orderDesc('position'),
                Query.limit(1)
            ]
        )

        const newPosition = highestPositionTask.documents.length > 0 ? highestPositionTask.documents[0].position + 1000 : 1000

        const task = await databases.createDocument(
            DATABASE_ID,
            TASKS_ID,
            ID.unique(),
            {
                name,
                description,
                status,
                assigneeId,
                dueDate,
                projectId,
                workspaceId,
                position: newPosition,
            }
        )

        // Notification: Task Assigned
        if (assigneeId) {
            const assigneeMember = await databases.getDocument(
                DATABASE_ID,
                MEMBERS_ID,
                assigneeId
            )

            if (assigneeMember.userId !== user.$id) {
                await databases.createDocument(
                    DATABASE_ID,
                    NOTIFICATIONS_ID,
                    ID.unique(),
                    {
                        userId: assigneeMember.userId,
                        workspaceId,
                        title: 'New Task Assigned',
                        message: `You have been assigned to task: ${name}`,
                        type: NotificationType.TASK_ASSIGNED,
                        targetId: task.$id,
                        isRead: false,
                    }
                )
            }
        }

        return c.json({
            task
        })  
    })
    .patch('/:taskId', sessionMiddleware, zValidator('json', createTaskSchema.partial()), async (c) => {
        const user = c.get('user')
        const databases = c.get('databases')
        const {name, description, status, assigneeId, dueDate, projectId} = c.req.valid('json')
        const { taskId } = c.req.param()

        const existingTask = await databases.getDocument<Task>(
            DATABASE_ID,
            TASKS_ID,
            taskId
        )

        const currentMember = await getMember({
            userId: user.$id,
            workspaceId: existingTask.workspaceId,
            databases
        })

        if(!currentMember) {
            return c.json({
                error: 'Unauthorized'
            }, 401)
        }

        const task = await databases.updateDocument(
            DATABASE_ID,
            TASKS_ID,
            taskId,
            {
                name,
                description,
                status,
                assigneeId,
                dueDate,
                projectId
            }
        )

        // Notification: Status Updated or Re-assigned
        const isStatusChanged = status && status !== existingTask.status
        const isAssigneeChanged = assigneeId && assigneeId !== existingTask.assigneeId

        if (isStatusChanged || isAssigneeChanged) {
            const currentAssigneeId = existingTask.assigneeId
            const currentAssigneeMember = await databases.getDocument(
                DATABASE_ID,
                MEMBERS_ID,
                currentAssigneeId
            )

            const newAssigneeId = isAssigneeChanged ? assigneeId : null
            const newAssigneeMember = newAssigneeId ? await databases.getDocument(
                DATABASE_ID,
                MEMBERS_ID,
                newAssigneeId
            ) : null


            let payloadForCurrentAssignee = {
                userId: currentAssigneeMember.userId,
                workspaceId: existingTask.workspaceId,
                title: '',
                message: '',
                type: '',
                targetId: task.$id,
                isRead: false,
            }

            let payloadForNewAssignee = newAssigneeId ? {
                userId: newAssigneeMember?.userId,
                workspaceId: existingTask.workspaceId,
                title: '',
                message: '',
                type: '',
                targetId: task.$id,
                isRead: false,
            }: null

            if (isAssigneeChanged && payloadForNewAssignee) {
                payloadForNewAssignee = {
                    ...payloadForNewAssignee,
                    title: 'New Task Assigned',
                    message: `You have been assigned to task: ${name || existingTask.name}`,
                    type: NotificationType.TASK_ASSIGNED
                }

                payloadForCurrentAssignee = {
                    ...payloadForCurrentAssignee,
                    title: 'Task Unassigned',
                    message: `Task "${name || existingTask.name}" has been unassigned from you`,
                    type: NotificationType.TASK_UNASSIGNED
                }

                // Notification for new assignee
                await databases.createDocument(
                    DATABASE_ID,
                    NOTIFICATIONS_ID,
                    ID.unique(),
                    payloadForNewAssignee
                )


                // Notification for current assignee
                if (currentAssigneeMember.userId !== user.$id) {
                    await databases.createDocument(
                        DATABASE_ID,
                        NOTIFICATIONS_ID,
                        ID.unique(),
                        payloadForCurrentAssignee
                    )
                }
            }
            
            if (isStatusChanged) {
                if (!isAssigneeChanged) {
                    payloadForCurrentAssignee = {
                        ...payloadForCurrentAssignee,
                        title: 'Task Status Updated',
                        message: `Task "${name || existingTask.name}" status updated to ${status}`,
                        type: NotificationType.STATUS_UPDATED
                    }

                    // Notification for current assignee
                    if (currentAssigneeMember.userId !== user.$id) {
                        await databases.createDocument(
                            DATABASE_ID,
                            NOTIFICATIONS_ID,
                            ID.unique(),
                            payloadForCurrentAssignee
                        )
                    }
                } else if (isAssigneeChanged && payloadForNewAssignee) {
                    payloadForNewAssignee = {
                        ...payloadForNewAssignee,
                        title: 'Task Status Updated',
                        message: `Task "${name || existingTask.name}" status updated to ${status}`,
                        type: NotificationType.STATUS_UPDATED
                    }

                    // Notification for new assignee
                    if (newAssigneeMember?.userId !== user.$id) {
                        await databases.createDocument(
                            DATABASE_ID,
                            NOTIFICATIONS_ID,
                            ID.unique(),
                            payloadForNewAssignee
                        )
                    }
                }
            }
        }

        return c.json({
            data: {
                $id: task.$id
            }
        })  
    })
    .post('/bulk-update', sessionMiddleware, zValidator('json',z.object({
        tasks: z.array(
            z.object({
                $id: z.string(),
                status: z.nativeEnum(TaskStatus),
                position: z.number().int().positive().min(1000).max(1_000_000)
            })
        )
    })), async (c) => {
        const databases = c.get('databases')
        const user = c.get('user')
        const { tasks } = c.req.valid('json')

        const taskToUpdate = await databases.listDocuments<Task>(
            DATABASE_ID,
            TASKS_ID,
            [
                Query.contains('$id', tasks.map((task) => task.$id))
            ]
        )

        const workspaceIds = new Set(taskToUpdate.documents.map(task => task.workspaceId))

        if(workspaceIds.size !== 1) {
            return c.json({
                error: 'All tasks must belong to the same workspace'
            }, 400)
        }

        const workspaceId = workspaceIds.values().next().value

        if (!workspaceId) {
            return c.json({
                error: 'Workspace not found'
            }, 404)
        }

        const member = await getMember({
            userId: user.$id,
            workspaceId,
            databases
        })

        if(!member) {
            return c.json({
                error: 'Unauthorized'
            }, 401)
        }

        const updatedTasks = await Promise.all(
            tasks.map(async (task) => {
                const { $id, status, position } = task
                const updatedTask = await databases.updateDocument(
                    DATABASE_ID,
                    TASKS_ID,
                    $id,
                    {
                        status,
                        position
                    }
                )
                return updatedTask
            })
        )

        await Promise.all(
            taskToUpdate.documents.map(async (task) => {
                const {assigneeId, name, $id } = task
                const updatedTask = updatedTasks.find((updatedTask) => updatedTask.$id === task.$id)
                if (assigneeId !== member?.$id && updatedTask?.status !== task.status) {
                    const assigneeMember = await databases.getDocument(
                        DATABASE_ID,
                        MEMBERS_ID,
                        assigneeId
                    )

                    if (!assigneeMember) {
                        return
                    }

                    await databases.createDocument(
                        DATABASE_ID,
                        NOTIFICATIONS_ID,
                        ID.unique(),
                        {
                            userId: assigneeMember?.userId,
                            workspaceId,
                            title: 'Task Status Updated',
                            message: `Task "${name}" status updated to ${updatedTask?.status}`,
                            type: NotificationType.STATUS_UPDATED,
                            targetId: $id,
                            isRead: false,
                        }
                    )
                }
            })
        )

        return c.json({
            data: updatedTasks
        })
    })
    

export default app