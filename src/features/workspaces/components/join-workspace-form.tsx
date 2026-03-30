'use client'

import { useRouter } from 'next/navigation'
import { DottedSeparator } from '@/components/dotted-separator'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import { useJoinWorkspace } from '../api/use-join-workspace'
import { useInviteCode } from '../hooks/use-invite-code'
import { useWorkspaceId } from '../hooks/use-workspace-id'

interface JoinWorkspaceFormProps {
  initialValue: {
    name: string
  }
}

const JoinWorkspaceForm = ({ initialValue }: JoinWorkspaceFormProps) => {
  const router = useRouter()

  const { mutate, isPending } = useJoinWorkspace()
  const workspaceId = useWorkspaceId()
  const inviteCode = useInviteCode()

  const onJoinWorkspace = () => {
    if (!inviteCode) return

    mutate(
      {
        param: {
          workspaceId: workspaceId,
        },
        json: {
          inviteCode: inviteCode,
        },
      },
      {
        onSuccess: ({ data }) => {
          router.push(`/workspaces/${data.$id}`)
        },
      },
    )
  }

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="p-7">
        <CardTitle className="text-xl font-bold">Join a Workspace</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join <strong>{initialValue.name}</strong>{' '}
          workspace. Click the button below to join the workspace and start
          collaborating with your team.
        </CardDescription>
      </CardHeader>
      <DottedSeparator />
      <CardContent className="p-7">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-y-2">
          <Button
            className="w-full lg:w-fit"
            variant="secondary"
            type="button"
            asChild
            size="lg"
            disabled={isPending}
          >
            <Link href="/">Cancel</Link>
          </Button>
          <Button
            className="w-full lg:w-fit"
            size="lg"
            type="button"
            onClick={onJoinWorkspace}
            disabled={isPending}
          >
            Join Workspace
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default JoinWorkspaceForm
