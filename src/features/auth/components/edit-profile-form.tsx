'use client';

import { useEffect, useRef, useState } from 'react';

// Helpers
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Hooks
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

// Schemas
import { updateProfileSchema } from '../schemas';

// Types
import { User } from '../type';

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeftIcon, ImageIcon, Pencil } from 'lucide-react';

// Next
import Image from 'next/image';

// Libs
import { toast } from 'sonner';

// API
import { useUpdateProfile } from '../api/use-update-profile';

// Utils
import { hashPassword } from '@/lib/utils';

interface EditProfileFormProps {
  onCancel?: () => void;
  initialValues: User;
}

export const EditProfileForm = ({
  onCancel,
  initialValues,
}: EditProfileFormProps) => {
  const { mutate, isPending } = useUpdateProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isUpdateEmail, setIsUpdateEmail] = useState(false);
  const [isUpdateName, setIsUpdateName] = useState(false);
  const [isUpdateImage, setIsUpdateImage] = useState(false);
  const form = useForm<z.input<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      ...initialValues,
      image: initialValues.imageUrl ?? undefined,
    },
  });

  const onSubmit = async (data: z.input<typeof updateProfileSchema>) => {
    if (isUpdateEmail && !data.password) {
      toast.error('Password is required');
      return;
    }

    if (isUpdateEmail && data.password) {
      data.password = await hashPassword(data.password);
    }

    if (data.email === initialValues.email && isUpdateEmail) {
      toast.error('Email has no changes');
      return;
    }

    if (data.name === initialValues.name && isUpdateName) {
      toast.error('Name has no changes');
      return;
    }

    if (data.image === initialValues.imageUrl && isUpdateImage) {
      toast.error('Image has no changes');
      return;
    }

    if (!isUpdateEmail && !isUpdateName && !isUpdateImage) {
      toast.error('No changes to update');
      return;
    }

    const finalData = {
      ...(isUpdateName && { name: data.name }),
      ...(isUpdateEmail && { email: data.email, password: data.password }),
      ...(isUpdateImage && {
        image: data.image instanceof File ? data.image : 'delete',
      }),
    };

    mutate({
      form: finalData,
    });
  };

  const handleEmailChange = () => {
    setIsUpdateEmail((prev) => !prev);
  };

  const handleNameChange = () => {
    setIsUpdateName((prev) => !prev);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement> | null) => {
    const file = e?.target.files?.[0];
    if (file) {
      form.setValue('image', file);
    } else {
      form.setValue('image', '');
    }
    setIsUpdateImage(true);
  };

  return (
    <div className="flex flex-col gap-y-4">
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
          <Button
            onClick={onCancel ? onCancel : () => router.back()}
            variant="outline"
            disabled={isPending}
            size="sm"
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
          <CardTitle className="text-xl font-bold">Edit Profile</CardTitle>
        </CardHeader>
        <div className="px-7">
          <DottedSeparator />
        </div>
        <CardContent className="p-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-y-4">
                <div className="flex items-center gap-x-2">
                  <FormLabel>Name</FormLabel>
                  <Pencil
                    className="size-4 text-muted-foreground cursor-pointer"
                    onClick={handleNameChange}
                  />
                </div>
                {isUpdateName ? (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Enter user name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="flex flex-col gap-y-2">
                    <Input value={initialValues.name} disabled />
                  </div>
                )}

                <div className="flex items-center gap-x-2">
                  <FormLabel>Email</FormLabel>
                  <Pencil
                    className="size-4 text-muted-foreground cursor-pointer"
                    onClick={handleEmailChange}
                  />
                </div>
                {isUpdateEmail ? (
                  <div className="flex flex-col gap-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Enter email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-y-2">
                    <Input value={initialValues.email} disabled />
                  </div>
                )}

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
                          <p className="text-sm">User Avatar</p>
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
                                field.onChange('');
                                if (inputRef.current) {
                                  inputRef.current.value = '';
                                }
                                handleImageChange(null);
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
    </div>
  );
};
