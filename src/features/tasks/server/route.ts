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
import { sendEmailNotification } from "@/features/notifications/utils";

// types
import { Task, TaskStatus, TaskPriority } from "../types";

// config
import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID, NOTIFICATIONS_ID, IMAGES_BUCKET_ID } from "@/config";
import { createAdminClient } from "@/lib/appwrite";
import { Project } from "@/features/projects/type";
import { NotificationType } from "@/features/notifications/types";
import { createActivity } from "@/features/activities/utils";
import { ActivityType } from "@/features/activities/types";

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

        // Cascade delete sub-tasks
        try {
            const subTasks = await databases.listDocuments<Task>(
                DATABASE_ID,
                TASKS_ID,
                [Query.equal('parentId', taskId)]
            )
            
            await Promise.all(
                subTasks.documents.map((subTask) =>
                    databases.deleteDocument(DATABASE_ID, TASKS_ID, subTask.$id)
                )
            )
        } catch (error) {
            console.error("Failed to cascade delete subtasks:", error)
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
        priority: z.nativeEnum(TaskPriority).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish(),      
        parentId: z.string().nullish(),
    })), async (c) => {
        const { users } = await createAdminClient()
        const user = c.get('user')
        const databases = c.get('databases')
        const {workspaceId, projectId, assigneeId, status, priority, search, dueDate, parentId} = c.req.valid('query')

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

        if (parentId) {
            query.push(Query.equal('parentId', parentId))
        } else {
            query.push(Query.isNull('parentId'))
        }

        if(projectId){
            query.push(Query.equal('projectId', projectId))
        } 

        if(assigneeId){
            if (assigneeId === 'unassigned') {
                query.push(Query.isNull('assigneeId'))
            } else {
                query.push(Query.equal('assigneeId', assigneeId))
            }
        }
        
        if(status){
            query.push(Query.equal('status', status))
        }

        if(priority){
            query.push(Query.equal('priority', priority))
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
        const assigneeIds = tasks.documents.map((task) => task.assigneeId).filter((id): id is string => !!id)
        const parentIds = tasks.documents.map((task) => task.$id)

        const subTasksList = parentIds.length > 0 ? await databases.listDocuments<Task>(
            DATABASE_ID,
            TASKS_ID,
            [Query.equal('parentId', parentIds)]
        ) : { documents: [] }

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

        const storage = c.get('storage')
        const assignees = await Promise.all(
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
                        console.error("Failed to get assignee file preview:", error)
                    }
                }
                return {
                    ...member,
                    name: user.name,
                    email: user.email,
                    avatarUrl
                }
            })
        )

        const populatedTasks = tasks.documents.map((task) => {
            const project = projects.documents.find((project) => project.$id === task.projectId)
            const assignee = assignees.find((assignee) => assignee.$id === task.assigneeId)

            const taskSubTasks = subTasksList.documents.filter((subTask) => subTask.parentId === task.$id)
            const totalSubTasks = taskSubTasks.length
            const completedSubTasks = taskSubTasks.filter((subTask) => subTask.status === TaskStatus.DONE).length

            return {
                ...task,
                project,
                assignee,
                totalSubTasks,
                completedSubTasks
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

        let assignee = null;
        if (task.assigneeId) {
            try {
                const assigneeMember = await databases.getDocument(
                    DATABASE_ID,
                    MEMBERS_ID,
                    task.assigneeId
                )

                const assigneeUser = await users.get(assigneeMember.userId)

                const imageId = assigneeUser.prefs?.imageId;
                let avatarUrl: string | undefined
                if (imageId) {
                    try {
                        const storage = c.get('storage')
                        const arrayBuffer = await storage.getFilePreview(
                            IMAGES_BUCKET_ID,
                            imageId,
                        )
                        avatarUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`
                    } catch (error) {
                        console.error("Failed to get task assignee file preview:", error)
                    }
                }

                assignee = {
                    ...assigneeMember,
                    name: assigneeUser.name || assigneeUser.email,
                    email: assigneeUser.email,
                    avatarUrl
                }
            } catch (error) {
                console.error("Failed to fetch assignee:", error)
            }
        }

        let parentTask = null;
        if (task.parentId) {
            try {
                parentTask = await databases.getDocument<Task>(
                    DATABASE_ID,
                    TASKS_ID,
                    task.parentId
                )
            } catch (error) {
                console.error("Failed to fetch parent task:", error)
            }
        }

        const subTasks = await databases.listDocuments<Task>(
            DATABASE_ID,
            TASKS_ID,
            [Query.equal('parentId', taskId)]
        )
        const totalSubTasks = subTasks.documents.length
        const completedSubTasks = subTasks.documents.filter(st => st.status === TaskStatus.DONE).length

        return c.json({
            data: {
                ...task,
                project,
                assignee,
                parentTask,
                totalSubTasks,
                completedSubTasks
            }
        })
    })
    .post('/', sessionMiddleware, zValidator('json', createTaskSchema), async (c) => {
        const user = c.get('user')
        const databases = c.get('databases')
        const {name, description, status, assigneeId, dueDate, projectId, workspaceId, parentId, priority} = c.req.valid('json')

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

        if (parentId) {
            const parentTaskDoc = await databases.getDocument<Task>(
                DATABASE_ID,
                TASKS_ID,
                parentId
            )
            if (parentTaskDoc.parentId) {
                return c.json({
                    error: 'Sub-tasks cannot have sub-tasks'
                }, 400)
            }
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
                parentId,
                priority,
            }
        )

        // Activity: Task Created
        await createActivity({
            databases,
            taskId: task.$id,
            workspaceId,
            userId: user.$id,
            type: ActivityType.TASK_CREATED,
            description: 'created the task',
        });

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

                await sendEmailNotification({
                    userId: assigneeMember.userId,
                    title: 'New Task Assigned',
                    message: `You have been assigned to task: ${name}. Click here to view the task: ${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/tasks/${task.$id}`,
                })
            }
        }

        return c.json({
            task
        })  
    })
    .patch('/:taskId', sessionMiddleware, zValidator('json', createTaskSchema.partial()), async (c) => {
        const user = c.get('user')
        const databases = c.get('databases')
        const {name, description, status, assigneeId, dueDate, projectId, parentId, priority} = c.req.valid('json')
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

        if (parentId) {
            const parentTaskDoc = await databases.getDocument<Task>(
                DATABASE_ID,
                TASKS_ID,
                parentId
            )
            if (parentTaskDoc.parentId) {
                return c.json({
                    error: 'Sub-tasks cannot have sub-tasks'
                }, 400)
            }
        }
        if (status === TaskStatus.DONE) {
            const subTasks = await databases.listDocuments<Task>(
                DATABASE_ID,
                TASKS_ID,
                [Query.equal('parentId', taskId)]
            )
            const hasUncompletedSubTasks = subTasks.documents.some(
                (subTask) => subTask.status !== TaskStatus.DONE
            )
            if (hasUncompletedSubTasks) {
                return c.json({
                    error: 'Cannot mark task as done: all of its sub-tasks must be done first'
                }, 400)
            }
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
                projectId,
                parentId,
                priority,
            }
        )

        // Activity Logging
        const activities = [];

        if (name && name !== existingTask.name) {
            activities.push(createActivity({
                databases,
                taskId,
                workspaceId: existingTask.workspaceId,
                userId: user.$id,
                type: ActivityType.NAME_CHANGED,
                description: `changed name from "${existingTask.name}" to "${name}"`,
            }));
        }

        if (description !== undefined && description !== existingTask.description) {
            activities.push(createActivity({
                databases,
                taskId,
                workspaceId: existingTask.workspaceId,
                userId: user.$id,
                type: ActivityType.DESCRIPTION_CHANGED,
                description: 'updated the description',
            }));
        }

        if (status && status !== existingTask.status) {
            activities.push(createActivity({
                databases,
                taskId,
                workspaceId: existingTask.workspaceId,
                userId: user.$id,
                type: ActivityType.STATUS_CHANGED,
                description: `changed status from ${existingTask.status} to ${status}`,
            }));
        }

        if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
            activities.push(createActivity({
                databases,
                taskId,
                workspaceId: existingTask.workspaceId,
                userId: user.$id,
                type: ActivityType.ASSIGNEE_CHANGED,
                description: assigneeId ? 'reassigned the task' : 'unassigned the task',
            }));
        }

        if (dueDate && new Date(dueDate).getTime() !== new Date(existingTask.dueDate).getTime()) {
            activities.push(createActivity({
                databases,
                taskId,
                workspaceId: existingTask.workspaceId,
                userId: user.$id,
                type: ActivityType.DUE_DATE_CHANGED,
                description: `changed due date to ${new Date(dueDate).toLocaleDateString()}`,
            }));
        }

        if (projectId && projectId !== existingTask.projectId) {
            activities.push(createActivity({
                databases,
                taskId,
                workspaceId: existingTask.workspaceId,
                userId: user.$id,
                type: ActivityType.PROJECT_CHANGED,
                description: 'moved the task to another project',
            }));
        }

        if (priority && priority !== existingTask.priority) {
            activities.push(createActivity({
                databases,
                taskId,
                workspaceId: existingTask.workspaceId,
                userId: user.$id,
                type: ActivityType.PRIORITY_CHANGED,
                description: `changed priority from ${existingTask.priority || 'MEDIUM'} to ${priority}`,
            }));
        }

        if (activities.length > 0) {
            await Promise.all(activities);
        }

        // Notification: Status Updated or Re-assigned
        const isStatusChanged = status && status !== existingTask.status
        const isAssigneeChanged = assigneeId !== undefined && assigneeId !== existingTask.assigneeId

        if (isStatusChanged || isAssigneeChanged) {
            const currentAssigneeId = existingTask.assigneeId
            const currentAssigneeMember = currentAssigneeId ? await databases.getDocument(
                DATABASE_ID,
                MEMBERS_ID,
                currentAssigneeId
            ) : null

            const newAssigneeId = isAssigneeChanged ? assigneeId : null
            const newAssigneeMember = newAssigneeId ? await databases.getDocument(
                DATABASE_ID,
                MEMBERS_ID,
                newAssigneeId
            ) : null


            let payloadForCurrentAssignee = currentAssigneeMember ? {
                userId: currentAssigneeMember.userId,
                workspaceId: existingTask.workspaceId,
                title: '',
                message: '',
                type: '',
                targetId: task.$id,
                isRead: false,
            } : null

            let payloadForNewAssignee = newAssigneeMember ? {
                userId: newAssigneeMember.userId,
                workspaceId: existingTask.workspaceId,
                title: '',
                message: '',
                type: '',
                targetId: task.$id,
                isRead: false,
            }: null

            if (isAssigneeChanged && payloadForNewAssignee && newAssigneeMember) {
                payloadForNewAssignee = {
                    ...payloadForNewAssignee,
                    title: 'New Task Assigned',
                    message: `You have been assigned to task: ${name || existingTask.name}`,
                    type: NotificationType.TASK_ASSIGNED
                }

                if (payloadForCurrentAssignee && currentAssigneeMember) {
                    payloadForCurrentAssignee = {
                        ...payloadForCurrentAssignee,
                        title: 'Task Unassigned',
                        message: `Task "${name || existingTask.name}" has been unassigned from you`,
                        type: NotificationType.TASK_UNASSIGNED
                    }
                }

                // Notification for new assignee
                await databases.createDocument(
                    DATABASE_ID,
                    NOTIFICATIONS_ID,
                    ID.unique(),
                    payloadForNewAssignee
                )

                // Email notification for new assignee
                await sendEmailNotification({
                    userId: payloadForNewAssignee.userId,
                    title: payloadForNewAssignee.title,
                    message: `${payloadForNewAssignee.message}. Click here to view the task: ${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${existingTask.workspaceId}/tasks/${task.$id}`,
                })


                // Notification for current assignee
                if (currentAssigneeMember && currentAssigneeMember.userId !== user.$id && payloadForCurrentAssignee) {
                    await databases.createDocument(
                        DATABASE_ID,
                        NOTIFICATIONS_ID,
                        ID.unique(),
                        payloadForCurrentAssignee
                    )

                    // Email notification for current assignee
                    await sendEmailNotification({
                        userId: payloadForCurrentAssignee.userId,
                        title: payloadForCurrentAssignee.title,
                        message: `${payloadForCurrentAssignee.message}`,
                    })
                }
            } else if (isAssigneeChanged && !newAssigneeId && payloadForCurrentAssignee && currentAssigneeMember) {
                // Task was unassigned and not reassigned to anyone
                payloadForCurrentAssignee = {
                    ...payloadForCurrentAssignee,
                    title: 'Task Unassigned',
                    message: `Task "${name || existingTask.name}" has been unassigned from you`,
                    type: NotificationType.TASK_UNASSIGNED
                }

                if (currentAssigneeMember.userId !== user.$id) {
                    await databases.createDocument(
                        DATABASE_ID,
                        NOTIFICATIONS_ID,
                        ID.unique(),
                        payloadForCurrentAssignee
                    )

                    await sendEmailNotification({
                        userId: payloadForCurrentAssignee.userId,
                        title: payloadForCurrentAssignee.title,
                        message: `${payloadForCurrentAssignee.message}`,
                    })
                }
            }
            
            if (isStatusChanged) {
                if (!isAssigneeChanged && currentAssigneeMember && payloadForCurrentAssignee) {
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

                        await sendEmailNotification({
                            userId: payloadForCurrentAssignee.userId,
                            title: payloadForCurrentAssignee.title,
                            message: `${payloadForCurrentAssignee.message}. Click here to view the task: ${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${existingTask.workspaceId}/tasks/${task.$id}`,
                        })
                    }
                } else if (isAssigneeChanged && payloadForNewAssignee && newAssigneeMember) {
                    payloadForNewAssignee = {
                        ...payloadForNewAssignee,
                        title: 'Task Status Updated',
                        message: `Task "${name || existingTask.name}" status updated to ${status}`,
                        type: NotificationType.STATUS_UPDATED
                    }

                    // Notification for new assignee
                    if (newAssigneeMember.userId !== user.$id) {
                        await databases.createDocument(
                            DATABASE_ID,
                            NOTIFICATIONS_ID,
                            ID.unique(),
                            payloadForNewAssignee
                        )

                        // Email notification for new assignee
                        await sendEmailNotification({
                            userId: payloadForNewAssignee.userId,
                            title: payloadForNewAssignee.title,
                            message: `${payloadForNewAssignee.message}. Click here to view the task: ${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${existingTask.workspaceId}/tasks/${task.$id}`,
                        })
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

        // Check that any parent task being updated to DONE has all sub-tasks completed
        for (const task of tasks) {
            if (task.status === TaskStatus.DONE) {
                const subTasks = await databases.listDocuments<Task>(
                    DATABASE_ID,
                    TASKS_ID,
                    [Query.equal('parentId', task.$id)]
                )
                const hasUncompletedSubTasks = subTasks.documents.some(
                    (subTask) => subTask.status !== TaskStatus.DONE
                )
                if (hasUncompletedSubTasks) {
                    const originalTask = taskToUpdate.documents.find(t => t.$id === task.$id)
                    const taskName = originalTask ? `"${originalTask.name}"` : 'Task'
                    return c.json({
                        error: `Cannot mark ${taskName} as done: all of its sub-tasks must be done first`
                    }, 400)
                }
            }
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
                if (assigneeId && assigneeId !== member?.$id && updatedTask?.status !== task.status) {
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

                    // Email notification for assignee
                    await sendEmailNotification({
                        userId: assigneeMember?.userId,
                        title: 'Task Status Updated',
                        message: `Task "${name}" status updated to ${updatedTask?.status}. Click here to view the task: ${process.env.NEXT_PUBLIC_APP_URL}/workspaces/${workspaceId}/tasks/${task.$id}`,
                    })
                }
            })
        )

        return c.json({
            data: updatedTasks
        })
    })
    

export default app