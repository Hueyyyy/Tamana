'use client';

//Assets
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

//Components
import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

//Hooks
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useLogin } from '../api/use-login';

//Helpers
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

//Schemas
import { loginSchema } from '../schemas';

//Libs
import { signUpWithGithub, signUpWithGoogle } from '@/lib/oauth';

const SignInCard = () => {
  const { mutate, isPending } = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    mutate({
      json: values,
    });
  };

  return (
    <Card className="w-full h-full md:w-[487px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl font-semibold">Sign In</CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
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
                  <FormControl>
                    <Input
                      type="password"
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
              Login
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
          onClick={() => signUpWithGoogle()}
        >
          <FcGoogle />
          Login with Google
        </Button>
        <Button
          disabled={isPending}
          variant={'secondary'}
          size={'lg'}
          className="w-full font-semibold"
          onClick={() => signUpWithGithub()}
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
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-blue-500 font-semibold">
            Sign Up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

export default SignInCard;
