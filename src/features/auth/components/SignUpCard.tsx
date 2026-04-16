'use client';

//Assets
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

//Components
import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from '@/components/ui/form';

//Hooks
import { useForm } from 'react-hook-form';
import { useSignUp } from '../api/use-signup';
import { useSearchParams } from 'next/navigation';

//Helpers
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

//Schemas
import { signupSchema } from '../schemas';
import { hashPassword } from '@/lib/utils';
import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

//Libs
import { signUpWithGithub, signUpWithGoogle } from '@/lib/oauth';

const SignUpCard = () => {
  const { mutate, isPending } = useSignUp();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [isShowPassword, setIsShowPassword] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleShowPassword = () => {
    setIsShowPassword((prev) => !prev);
  };

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    const hashedPassword = await hashPassword(values.password);
    mutate({ json: { ...values, password: hashedPassword } });
  };

  return (
    <Card className="w-full h-full md:w-[487px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl font-semibold">Sign Up</CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-x-2">
                    <FormLabel>Password</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleShowPassword}
                    >
                      {isShowPassword ? (
                        <EyeIcon className="size-4" />
                      ) : (
                        <EyeOffIcon className="size-4" />
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Input
                      type={isShowPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={isPending}
              className="w-full bg-blue-500 font-semibold"
              size={'lg'}
            >
              Register
            </Button>
          </form>
        </Form>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 space-y-4">
        <Button
          disabled={isPending}
          variant={'secondary'}
          size={'lg'}
          className="w-full font-semibold"
          onClick={() => signUpWithGoogle(next || undefined)}
        >
          <FcGoogle />
          Login with Google
        </Button>
        <Button
          disabled={isPending}
          variant={'secondary'}
          size={'lg'}
          className="w-full font-semibold"
          onClick={() => signUpWithGithub(next || undefined)}
        >
          <FaGithub />
          Login with Github
        </Button>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7 flex items-center justify-center">
        <p>
          Already have an account?{' '}
          <Link href={next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"} className="text-blue-500 font-semibold">
            Sign In
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

export default SignUpCard;
