"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster, toast } from "@/components/ui/sonner";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signUpSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const router = useRouter();
  const supabase = supabaseBrowser();

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in!");
    router.push("/dashboard");
  };

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { username: values.username } },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created!");
    router.push("/dashboard");
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-svh grid place-items-center bg-gradient-to-b from-white to-neutral-100 dark:from-black dark:to-neutral-900">
      <Toaster />
      <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-2xl shadow-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Sign In */}
          <div className="p-8 sm:p-10">
            <h2 className="text-2xl font-semibold mb-6">Welcome back</h2>
            <form
              className="space-y-4"
              onSubmit={signInForm.handleSubmit(handleSignIn)}
            >
              <div>
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" type="email" {...signInForm.register("email")} />
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {signInForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="si-password">Password</Label>
                <Input id="si-password" type="password" {...signInForm.register("password")} />
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {signInForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button className="w-full rounded-full" type="submit">
                Sign In
              </Button>
            </form>
          </div>

          {/* Sign Up */}
          <div className="p-8 sm:p-10">
            <h2 className="text-2xl font-semibold mb-6">Create account</h2>
            <form
              className="space-y-4"
              onSubmit={signUpForm.handleSubmit(handleSignUp)}
            >
              <div>
                <Label htmlFor="su-username">Username</Label>
                <Input id="su-username" {...signUpForm.register("username")} />
                {signUpForm.formState.errors.username && (
                  <p className="text-sm text-red-500 mt-1">
                    {signUpForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" type="email" {...signUpForm.register("email")} />
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {signUpForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="su-password">Password</Label>
                <Input id="su-password" type="password" {...signUpForm.register("password")} />
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button className="w-full rounded-full" type="submit">
                Sign Up
              </Button>
            </form>
          </div>
        </div>

        {/* Sliding overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className={
              "absolute inset-y-0 w-full sm:w-1/2 bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-2xl transition-transform duration-[700ms] ease-[cubic-bezier(.19,1,.22,1)] will-change-transform" +
              (isSignup ? " translate-x-0 sm:translate-x-full" : " translate-x-0")
            }
            style={{ opacity: 0.95 }}
          />
        </div>

        {/* Overlay content */}
        <div className="absolute inset-0 grid grid-cols-1 sm:grid-cols-2">
          <div className="hidden sm:flex items-center justify-center p-8">
            <div className="pointer-events-auto text-white">
              <h3 className="text-2xl font-semibold mb-2">New here?</h3>
              <p className="opacity-90 mb-4">Open an OptimaBank account in seconds.</p>
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => setMode("signup")}
              >
                Switch to Sign Up
              </Button>
            </div>
          </div>
          <div className="hidden sm:flex items-center justify-center p-8">
            <div className="pointer-events-auto text-white text-right">
              <h3 className="text-2xl font-semibold mb-2">Already have an account?</h3>
              <p className="opacity-90 mb-4">Sign in to your OptimaBank dashboard.</p>
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => setMode("signin")}
              >
                Switch to Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile mode toggle */}
        <div className="sm:hidden p-4 flex gap-2">
          <Button
            className="flex-1 rounded-full"
            variant={isSignup ? "outline" : "default"}
            onClick={() => setMode("signin")}
          >
            Sign In
          </Button>
          <Button
            className="flex-1 rounded-full"
            variant={isSignup ? "default" : "outline"}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
}


