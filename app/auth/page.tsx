"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
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
    router.push("/home");
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
    router.push("/home");
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`
      }
    });
    if (error) {
      toast.error(error.message);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="h-svh flex items-center justify-center bg-[linear-gradient(to_right,#e2e2e2,#c9d6ff)] p-4">
      <Toaster />
      <div className="relative w-full max-w-[900px] min-h-[480px] mx-auto overflow-hidden rounded-[30px] shadow-[0_5px_15px_rgba(0,0,0,0.35)] bg-white">
        {/* Forms Container */}
        <div className="relative w-full h-full">
          {/* Sign In Form */}
          <div className={`absolute top-0 left-0 w-full sm:w-1/2 h-full p-6 sm:p-10 transition-all duration-[700ms] ease-in-out ${isSignup ? "sm:translate-x-full -translate-x-full opacity-0 z-0 pointer-events-none" : "sm:translate-x-0 translate-x-0 z-30"}`}>
            <h1 className="text-3xl font-bold text-center">Sign In</h1>
            <div className="my-5 w-full flex items-center justify-center">
              <Button type="button" variant="outline" className="w-full max-w-[280px] h-10 border-neutral-300 text-neutral-800 bg-white hover:bg-neutral-50 rounded-[8px] gap-2" onClick={handleGoogleAuth}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.621 32.525 29.229 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.706 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.706 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.189-5.238C29.157 35.091 26.748 36 24 36c-5.203 0-9.574-3.338-11.16-7.988l-6.534 5.027C9.608 39.556 16.296 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.097 3.206-3.293 5.754-6.083 7.065.001-.001 6.189 5.238 6.189 5.238.438-.4 8.591-6.272 8.591-16.303 0-1.341-.138-2.651-.389-3.917z"/>
                </svg>
                <span className="text-sm font-semibold">Login with Google</span>
              </Button>
            </div>
            <span className="text-xs text-neutral-600 text-center block">or use your email password</span>
            <form className="mt-4 flex flex-col" onSubmit={signInForm.handleSubmit(handleSignIn)}>
              <Input placeholder="Email" type="email" className="bg-neutral-100" {...signInForm.register("email")} />
              {signInForm.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{signInForm.formState.errors.email.message}</p>
              )}
              <Input placeholder="Password" type="password" className="bg-neutral-100 mt-2" {...signInForm.register("password")} />
              {signInForm.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">{signInForm.formState.errors.password.message}</p>
              )}
              <div className="mt-2 text-[13px] text-center"><a className="text-neutral-700" href="#">Forget Your Password?</a></div>
              <Button type="submit" className="mt-3 uppercase tracking-wide rounded-[8px] bg-[#512da8] hover:bg-[#45249a]">Sign In</Button>
            </form>
          </div>

          {/* Sign Up Form */}
          <div className={`absolute top-0 left-0 w-full sm:w-1/2 h-full p-6 sm:p-10 transition-all duration-[700ms] ease-in-out ${isSignup ? "sm:translate-x-full translate-x-0 opacity-100 z-30" : "sm:translate-x-0 -translate-x-full opacity-0 z-0 pointer-events-none"}`}>
            <h1 className="text-2xl font-semibold text-center">Create Account</h1>
            <div className="my-5 w-full flex items-center justify-center">
              <Button type="button" variant="outline" className="w-full max-w-[280px] h-10 border-neutral-300 text-neutral-800 bg-white hover:bg-neutral-50 rounded-[8px] gap-2" onClick={handleGoogleAuth}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.621 32.525 29.229 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.706 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.706 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.189-5.238C29.157 35.091 26.748 36 24 36c-5.203 0-9.574-3.338-11.16-7.988l-6.534 5.027C9.608 39.556 16.296 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.097 3.206-3.293 5.754-6.083 7.065.001-.001 6.189 5.238 6.189 5.238.438-.4 8.591-6.272 8.591-16.303 0-1.341-.138-2.651-.389-3.917z"/>
                </svg>
                <span className="text-sm font-semibold">Login with Google</span>
              </Button>
            </div>
            <span className="text-xs text-neutral-600 text-center block">or use your email for registration</span>
            <form className="mt-4 flex flex-col" onSubmit={signUpForm.handleSubmit(handleSignUp)}>
              <Input placeholder="Name" className="bg-neutral-100" {...signUpForm.register("username")} />
              {signUpForm.formState.errors.username && (
                <p className="text-sm text-red-500 mt-1">{signUpForm.formState.errors.username.message}</p>
              )}
              <Input placeholder="Email" type="email" className="bg-neutral-100 mt-2" {...signUpForm.register("email")} />
              {signUpForm.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{signUpForm.formState.errors.email.message}</p>
              )}
              <Input placeholder="Password" type="password" className="bg-neutral-100 mt-2" {...signUpForm.register("password")} />
              {signUpForm.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">{signUpForm.formState.errors.password.message}</p>
              )}
              <Button type="submit" className="mt-3 uppercase tracking-wide rounded-[8px] bg-[#512da8] hover:bg-[#45249a]">Sign Up</Button>
            </form>
          </div>
        </div>

         {/* Purple sliding overlay with toggle panels */}
         <div className="pointer-events-none absolute inset-0">
           <div
             className={`absolute inset-y-0 left-1/2 w-1/2 bg-[linear-gradient(to_right,#5c6bc0,#512da8)] text-white transition-all duration-[600ms] ease-in-out ${isSignup ? "-translate-x-full" : "translate-x-0"}`}
             style={{ 
               boxShadow: "0 5px 15px rgba(0,0,0,0.35)",
               borderRadius: isSignup ? "0 150px 150px 0" : "150px 0 0 150px"
             }}
           />
         </div>

        {/* Overlay content (two toggle panels) */}
        <div className="absolute inset-0 grid grid-cols-2 z-20">
          <div className={`flex items-center justify-center p-8 transition-transform duration-[600ms] ease-in-out ${isSignup ? "translate-x-0" : "-translate-x-[200%]"}`}>
            <div className="pointer-events-auto text-white text-center max-w-xs">
              <h2 className="text-2xl font-semibold">Welcome Back!</h2>
              <p className="mt-1 opacity-90">Enter your personal details to use all of site features</p>
              <Button variant="secondary" className="mt-4 rounded-[8px] uppercase" onClick={() => setMode("signin")}>Sign In</Button>
            </div>
          </div>
          <div className={`flex items-center justify-center p-8 transition-transform duration-[600ms] ease-in-out ${isSignup ? "translate-x-[200%]" : "translate-x-0"}`}>
            <div className="pointer-events-auto text-white text-center max-w-xs">
              <h2 className="text-2xl font-semibold">Hello, Friend!</h2>
              <p className="mt-1 opacity-90">Register with your personal details to use all of site features</p>
              <Button variant="secondary" className="mt-4 rounded-[8px] uppercase" onClick={() => setMode("signup")}>Sign Up</Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


