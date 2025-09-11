import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getProfile() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, username, points")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }
  return { user, profile } as const;
}

export default async function DashboardPage() {
  const { profile } = await getProfile();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="rounded-xl border p-6 space-y-2">
        <p>
          <span className="font-medium">Email:</span> {profile?.email}
        </p>
        <p>
          <span className="font-medium">Username:</span> {profile?.username}
        </p>
        <p>
          <span className="font-medium">Points:</span> {profile?.points}
        </p>
      </div>

      <form action="/auth/signout" className="mt-6">
        <Button type="submit" className="rounded-full">Sign out</Button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        Trouble? <Link className="underline" href="/auth">Back to auth</Link>
      </p>
    </div>
  );
}


