import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'

import { serverLoginSchema, serverSignupSchema, serverUpdateProfileSchema } from '../schemas'
import { createAdminClient } from '@/lib/appwrite'
import { ID, Query } from 'node-appwrite'
import { deleteCookie, setCookie } from 'hono/cookie'
import { AUTH_COOKIE } from '../constants'
import { sessionMiddleware } from '@/lib/session-middleware'
import { IMAGES_BUCKET_ID } from '@/config'

const app = new Hono()
  .get('/current', sessionMiddleware, (c) => {
    const user = c.get('user')

    return c.json({
      data: user,
    })
  })
  .post('/login', zValidator('json', serverLoginSchema), async (c) => {
    const { email, password } = c.req.valid('json')

    const { account } = await createAdminClient()

    try {
      const session = await account.createEmailPasswordSession(email, password)

      setCookie(c, AUTH_COOKIE, session.secret, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return c.json({ success: true })
    } catch (err) {
      const error = err as Error & { code?: number };
      if (error.code === 401) {
        return c.json({ error: 'Authentication failed. Please check your credentials.' }, 401);
      }

      return c.json({ error: error.message || "Internal Server Error" }, 500);
    }

    
  })
  .post('/register', zValidator('json', serverSignupSchema), async (c) => {
    const { name, email, password } = c.req.valid('json')

    const { account, users } = await createAdminClient()

    try {
        const existingUsers = await users.list([
            Query.equal('email', [email])
        ]);

        if (existingUsers.total > 0) {
            return c.json({ error: 'This email is already registered' }, 409);
        }

        await account.create(ID.unique(), email, password, name);
        
        const session = await account.createEmailPasswordSession(email, password);

        setCookie(c, AUTH_COOKIE, session.secret, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30,
        });

        return c.json({ success: true });

    } catch (err) {
        const error = err as Error & { code?: number };
        if (error.code === 401) {
            return c.json({ error: 'Authentication failed. Please check your credentials.' }, 401);
        }

        return c.json({ error: error.message || "Internal Server Error" }, 500);
    }
  })
  .post('/logout', sessionMiddleware, async (c) => {
    const account = c.get('account')

    deleteCookie(c, AUTH_COOKIE)
    await account.deleteSession('current')

    return c.json({ success: true })
  })
  .patch('/update-profile', zValidator('form', serverUpdateProfileSchema), sessionMiddleware, async (c) => {
    const { name, email, password, image } = c.req.valid('form')

    const storage = c.get('storage')
    const account = c.get('account')

    try {
      if ((email !== undefined) && (password !== undefined)) {
        await account.updateEmail(email, password)
      }
      // if (password) {
      //   await account.updatePassword(password)
      // }
      if (name) {
        await account.updateName(name)
      }

      
      if (image instanceof File) {
        const fileResponse = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image,
        )

        await account.updatePrefs({
          imageId: fileResponse.$id,
        });

      } 
      else if (image === 'delete') {
        await account.updatePrefs({
          imageId: '',
        });
      }

      return c.json({ success: true })
    } catch (err) {
      const error = err as Error & { code?: number };
      if (error.code === 401) {
        return c.json({ error: 'Authentication failed. Please check your credentials.' }, 401);
      }

      return c.json({ error: error.message || "Internal Server Error" }, 500);
    }
  })
  .get('/profile-avatar', sessionMiddleware, async (c) => {
    const storage = c.get('storage')
    const user = c.get('user')

    try {
      const imageId = user.prefs?.imageId
      if (!imageId) {
        return c.json({ error: 'No image found' }, 404)
      }

      const arrayBuffer = await storage.getFilePreview(
        IMAGES_BUCKET_ID,
        imageId,
      )

      const imageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString(
        'base64',
      )}`

      return c.json({ data: {
        imageUrl
      } })
    } catch (err) {
      const error = err as Error & { code?: number };
      if (error.code === 401) {
        return c.json({ error: 'Authentication failed. Please check your credentials.' }, 401);
      }

      return c.json({ error: error.message || "Internal Server Error" }, 500);
    }
  })

export default app
