"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { analytics } from "@/lib/analytics";

// Animated counter component
function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
	const [count, setCount] = useState(0);
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true });

	useEffect(() => {
		if (!isInView) return;

		let startTime: number;
		const animate = (currentTime: number) => {
			if (!startTime) startTime = currentTime;
			const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
			
			const easeOutQuart = 1 - Math.pow(1 - progress, 4);
			setCount(Math.floor(easeOutQuart * end));
			
			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		};
		
		requestAnimationFrame(animate);
	}, [isInView, end, duration]);

	return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function FinalCTA() {
	return (
		<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<motion.div
				className="relative rounded-3xl bg-gradient-to-r from-[#ec1c24] via-[#ff7d00] to-[#ec1c24] p-12 text-center text-white overflow-hidden"
				initial={{ opacity: 0, y: 50, scale: 0.9 }}
				whileInView={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
				viewport={{ once: true }}
			>
				{/* Background decoration */}
				<div className="absolute inset-0 bg-gradient-to-r from-[#ff7d00]/20 to-[#ec1c24]/20"></div>
				<div className="absolute top-0 left-0 w-full h-full opacity-30">
					{[
						{ top: "10%", left: "15%" },
						{ top: "20%", left: "85%" },
						{ top: "60%", left: "10%" },
						{ top: "80%", left: "90%" },
						{ top: "30%", left: "70%" },
						{ top: "70%", left: "50%" }
					].map((position, i) => (
						<motion.div
							key={i}
							className="absolute w-2 h-2 bg-white rounded-full"
							style={{
								top: position.top,
								left: position.left,
							}}
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ 
								duration: 0.5, 
								delay: i * 0.1,
								repeat: Infinity,
								repeatType: "reverse",
								repeatDelay: 2
							}}
						/>
					))}
				</div>
				
				<div className="relative z-10">
					<motion.h2
						className="text-4xl font-bold mb-4"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
						viewport={{ once: true }}
					>
						Make banking feel effortless.
					</motion.h2>
					<motion.p
						className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
						viewport={{ once: true }}
					>
						Join thousands of customers who have already transformed their banking experience with Optima Bank.
					</motion.p>
					<motion.div
						className="flex flex-col sm:flex-row items-center justify-center gap-4"
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
						viewport={{ once: true }}
					>
						<Link
							href="/auth"
						className="px-8 py-4 rounded-xl bg-white text-[#ff7d00] font-semibold hover:bg-[#fff5eb] transition-all duration-300 hover:scale-105 hover:shadow-xl"
							onClick={() => analytics.track("final_cta_click")}
						>
							Open an Account
						</Link>
						<Link
							href="#"
						className="px-8 py-4 rounded-xl border-2 border-white text-white hover:bg-white hover:text-[#ec1c24] transition-all duration-300 hover:scale-105"
						>
							Get the App
						</Link>
					</motion.div>
					<motion.div
						className="mt-8 flex items-center justify-center gap-8 text-emerald-100"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
						viewport={{ once: true }}
					>
						{[
							{ number: <AnimatedCounter end={10000} duration={2} />, label: "Happy Customers" },
							{ number: "4.9★", label: "App Rating" },
							{ number: "24/7", label: "Support" }
						].map((stat, index) => (
							<motion.div
								key={index}
								className="text-center"
								initial={{ opacity: 0, scale: 0.8 }}
								whileInView={{ opacity: 1, scale: 1 }}
								transition={{ 
									duration: 0.5, 
									delay: 1.0 + index * 0.1, 
									ease: [0.25, 0.46, 0.45, 0.94] 
								}}
								viewport={{ once: true }}
							>
								<div className="text-2xl font-bold">{stat.number}</div>
								<div className="text-sm">{stat.label}</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</motion.div>
		</section>
	);
}