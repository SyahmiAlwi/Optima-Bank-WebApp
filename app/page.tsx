import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Benefits from "@/components/landing/Benefits";
import Product from "@/components/landing/Product";
import SocialProof from "@/components/landing/SocialProof";
import Security from "@/components/landing/Security";
import FinalCTA from "@/components/landing/FinalCTA";
import ShaderBackground from "@/components/landing/ShaderBackground";

export default function Page() {
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
