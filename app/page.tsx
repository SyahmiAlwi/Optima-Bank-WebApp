"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Benefits from "@/components/landing/Benefits";
import SocialProof from "@/components/landing/SocialProof";
import Security from "@/components/landing/Security";
import ShaderBackground from "@/components/landing/ShaderBackground";

export default function Page() {
	const router = useRouter();

	useEffect(() => {
		// Check if this is an OAuth callback with hash tokens
		const hash = typeof window !== "undefined" ? window.location.hash : "";
		if (hash && hash.includes("access_token") && hash.includes("refresh_token")) {
			console.log("OAuth callback detected on root page, handling auth directly");
			
			// Handle the OAuth callback directly here
			const handleOAuthCallback = async () => {
				try {
					const params = new URLSearchParams(hash.replace(/^#/, ""));
					const access_token = params.get("access_token");
					const refresh_token = params.get("refresh_token");
					
					if (access_token && refresh_token) {
						const { supabaseBrowser } = await import("@/lib/supabase/client");
						const supabase = supabaseBrowser();
						
						const { data, error } = await supabase.auth.setSession({
							access_token,
							refresh_token,
						});
						
						if (error) {
							console.error("Auth error:", error);
							router.replace("/auth");
							return;
						}
						
						console.log("Session set successfully:", data);
						router.replace("/home");
						return;
					}
				} catch (error) {
					console.error("Auth callback error:", error);
					router.replace("/auth");
				}
			};
			
			handleOAuthCallback();
			return;
		}
	}, [router]);

	return (
		<main className="min-h-screen text-white antialiased">
			<ShaderBackground>
				<Nav />
				<Hero />
				<div className="h-16" />
				<Benefits />
				<Security />
				<SocialProof />
			</ShaderBackground>
		</main>
	);
}
