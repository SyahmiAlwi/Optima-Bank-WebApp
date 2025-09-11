"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { username?: string; full_name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      // Redirect to auth if no user
      if (!user) {
        router.push("/auth");
      }
    };

    getUser();
  }, [supabase.auth, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (loading) {
    return (
      <div className="h-svh flex items-center justify-center bg-[linear-gradient(to_right,#e2e2e2,#c9d6ff)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#512da8] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-svh flex items-center justify-center bg-[linear-gradient(to_right,#e2e2e2,#c9d6ff)]">
      <div className="bg-white rounded-[30px] shadow-[0_5px_15px_rgba(0,0,0,0.35)] p-10 max-w-md w-full mx-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#512da8] mb-2">Welcome to OptimaBank!</h1>
          <p className="text-gray-600 mb-6">You have successfully signed in.</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">User Information:</h3>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {user.email}
            </p>
            {user.user_metadata?.username && (
              <p className="text-sm text-gray-600">
                <strong>Username:</strong> {user.user_metadata.username}
              </p>
            )}
            {user.user_metadata?.full_name && (
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> {user.user_metadata.full_name}
              </p>
            )}
          </div>

          <Button 
            onClick={handleSignOut}
            className="w-full uppercase tracking-wide rounded-[8px] bg-[#512da8] hover:bg-[#45249a]"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
