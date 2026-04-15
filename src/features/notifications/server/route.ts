import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { sessionMiddleware } from '@/lib/session-middleware'
import { Query } from 'node-appwrite'
import { DATABASE_ID, NOTIFICATIONS_ID } from '@/config'
import { Notification } from '../types'
import { markNotificationReadSchema } from '../schemas'

const app = new Hono()
  .get('/', sessionMiddleware, async (c) => {
    const databases = c.get('databases')
    const user = c.get('user')

    const notifications = await databases.listDocuments<Notification>(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      [
        Query.equal('userId', user.$id),
        Query.orderDesc('$createdAt'),
      ],
    )

    return c.json({ data: notifications })
  })
  .patch('/:notificationId', sessionMiddleware, zValidator('json', markNotificationReadSchema), async (c) => {
    const databases = c.get('databases')
    const user = c.get('user')
    const { notificationId } = c.req.param()
    const { isRead } = c.req.valid('json')

    const notification = await databases.getDocument<Notification>(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      notificationId
    )

    if (notification.userId !== user.$id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const updatedNotification = await databases.updateDocument(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      notificationId,
      { isRead }
    )

    return c.json({ data: updatedNotification })
  })
  .delete('/:notificationId', sessionMiddleware, async (c) => {
    const databases = c.get('databases')
    const user = c.get('user')
    const { notificationId } = c.req.param()

    const notification = await databases.getDocument<Notification>(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      notificationId
    )

    if (notification.userId !== user.$id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    await databases.deleteDocument(DATABASE_ID, NOTIFICATIONS_ID, notificationId)

    return c.json({ data: { $id: notificationId } })
  })

export default app
