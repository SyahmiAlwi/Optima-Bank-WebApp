"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Mode = "signin" | "signup";

export function AuthCard() {
  const [mode, setMode] = useState<Mode>("signin");
  const isSignup = mode === "signup";

  return (
    <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-2xl shadow-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
      {/* Sliding overlay only (stub for reuse) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={
            "absolute inset-y-0 w-full sm:w-1/2 bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-2xl transition-transform duration-[700ms] ease-[cubic-bezier(.19,1,.22,1)] will-change-transform" +
            (isSignup ? " translate-x-0 sm:translate-x-full" : " translate-x-0")
          }
          style={{ opacity: 0.95 }}
        />
      </div>

      <div className="sm:hidden p-4 flex gap-2">
        <Button className="flex-1 rounded-full" variant={isSignup ? "outline" : "default"} onClick={() => setMode("signin")}>
          Sign In
        </Button>
        <Button className="flex-1 rounded-full" variant={isSignup ? "default" : "outline"} onClick={() => setMode("signup")}>
          Sign Up
        </Button>
      </div>
    </div>
  );
}


