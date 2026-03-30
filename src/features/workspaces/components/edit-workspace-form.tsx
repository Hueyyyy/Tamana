'use client';

// Helpers
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Hooks
import { useForm } from 'react-hook-form';
import { useUpdateWorkspace } from '../api/use-update-workspace';
import { useDeleteWorkspace } from '../api/use-delete-workspace';
import { useRouter } from 'next/navigation';
import { useResetInviteCode } from '../api/use-reset-invite-code';
import useConfirm from '@/hooks/use-confirm';

// Schemas
import { updateWorkspaceSchema } from '../schemas';
import { Workspace } from '../type';

// Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DottedSeparator } from '@/components/dotted-separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeftIcon, CopyIcon, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface EditWorkspaceFormProps {
  onCancel?: () => void;
  initialValues: Workspace;
}

export const EditWorkspaceForm = ({
  onCancel,
  initialValues,
}: EditWorkspaceFormProps) => {
  const { mutate, isPending } = useUpdateWorkspace();
  const { mutate: deleteWorkspace, isPending: isDeletePending } =
    useDeleteWorkspace();
  const { mutate: resetInviteCode, isPending: isResetInviteCodePending } =
    useResetInviteCode();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [DeleteDialog, confirmDelete] = useConfirm({
    title: 'Delete Workspace',
    message:
      'Are you sure you want to delete this workspace? This action cannot be undone.',
    variant: 'destructive',
  });
  const [ResetDialog, confirmReset] = useConfirm({
    title: 'Reset Invite Code',
    message:
      'Are you sure you want to reset the invite code for this workspace? This action cannot be undone.',
    variant: 'destructive',
  });
  const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      ...initialValues,
      image: initialValues.imageUrl ?? '',
    },
  });

  const onSubmit = (data: z.infer<typeof updateWorkspaceSchema>) => {
    const finalData = {
      ...data,
      image: data.image instanceof File ? data.image : '',
    };
    mutate({
      form: finalData,
      param: { workspaceId: initialValues.$id },
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('image', file);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete();

    if (!confirmed) return;
    deleteWorkspace(
      {
        param: { workspaceId: initialValues.$id },
      },
      {
        onSuccess: () => {
          window.location.href = '/';
        },
      },
    );
  };
  const fullInviteLink = `${window.location.origin}/workspaces/${initialValues.$id}/join/${initialValues.inviteCode}`;

  const handleResetInviteCode = async () => {
    const confirmed = await confirmReset();
    if (!confirmed) return;
    resetInviteCode({
      param: { workspaceId: initialValues.$id },
    });
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(fullInviteLink).then(() => {
      toast.success('Invite link copied to clipboard!');
    });
  };

  return (
    <div className="flex flex-col gap-y-4">
      <DeleteDialog />
      <ResetDialog />
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
          <Button
            onClick={
              onCancel
                ? onCancel
                : () => router.push(`/workspaces/${initialValues.$id}`)
            }
            variant="outline"
            disabled={isPending}
            size="sm"
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
          <CardTitle className="text-xl font-bold">
            {initialValues.name}
          </CardTitle>
        </CardHeader>
        <div className="px-7">
          <DottedSeparator />
        </div>
        <CardContent className="p-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter workspace name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <div className="flex flex-col gap-y-2">
                      <div className="flex items-center gap-x-5">
                        {field.value ? (
                          <div className="size-[72px] rounded-md relative overflow-hidden">
                            <Image
                              alt="logo"
                              fill
                              className="object-cover"
                              src={
                                field.value instanceof File
                                  ? URL.createObjectURL(field.value)
                                  : field.value
                              }
                            />
                          </div>
                        ) : (
                          <Avatar className="size-[72px]">
                            <AvatarFallback>
                              <ImageIcon className="size-[36px] text-neutral-400" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col">
                          <p className="text-sm">Workspace Icon</p>
                          <p className="text-sm text-muted-foreground">
                            JPG, PNG, SVG, or JPEG up to 1MB
                          </p>
                          <input
                            type="file"
                            accept=".jpg, .png, .svg, .jpeg"
                            className="hidden"
                            ref={inputRef}
                            disabled={isPending}
                            onChange={handleImageChange}
                          />
                          {field.value ? (
                            <Button
                              type="button"
                              size="sm"
                              className="w-fit mt-2"
                              variant="destructive"
                              onClick={() => {
                                field.onChange(null);
                                if (inputRef.current) {
                                  inputRef.current.value = '';
                                }
                              }}
                              disabled={isPending}
                            >
                              <span className="text-xs">Remove Image</span>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className="w-fit mt-2"
                              variant="tertiary"
                              onClick={() => inputRef.current?.click()}
                              disabled={isPending}
                            >
                              <span className="text-xs">Upload Image</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
              <DottedSeparator className="py-7" />
              <div className="flex flex-row justify-end items-center">
                <Button type="submit" size="lg" disabled={isPending}>
                  Save changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card className="w-full h-full border-none shadow-none">
        <CardContent className="p-7">
          <div className="flex flex-col">
            <h3 className="font-bold">Invite Members</h3>
            <p className="text-sm text-muted-foreground">
              Use the link below to invite new members to your workspace.
            </p>
            <div className="mt-4">
              <div className="flex items-center gap-x-2">
                <Input value={fullInviteLink} disabled className="h-12" />
                <Button
                  variant="secondary"
                  className="size-12"
                  onClick={handleCopyInviteLink}
                >
                  <CopyIcon className="size-5" />
                </Button>
              </div>
            </div>
            <DottedSeparator className="py-7" />
            <Button
              type="button"
              variant="destructive"
              className="w-fit ml-auto"
              disabled={
                isPending || isDeletePending || isResetInviteCodePending
              }
              onClick={handleResetInviteCode}
            >
              Reset Invite Link
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full h-full border-none shadow-none">
        <CardContent className="p-7">
          <div className="flex flex-col">
            <h3 className="font-bold">Delete Workspace</h3>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All data in this workspace will be
              permanently deleted.
            </p>
            <DottedSeparator className="py-7" />
            <Button
              type="button"
              variant="destructive"
              className="w-fit ml-auto"
              disabled={isPending || isDeletePending}
              onClick={handleDelete}
            >
              Delete Workspace
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
