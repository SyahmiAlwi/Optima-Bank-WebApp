"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

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

export default function SocialProof() {
	return (
		<section className="min-h-screen flex items-center justify-center mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="grid lg:grid-cols-2 gap-12 items-center w-full">
				<motion.div
					className="text-left"
					initial={{ opacity: 0, x: -50 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					viewport={{ once: true }}
				>
					<h2 className="text-3xl font-bold text-white mb-4">What customers say</h2>
					<p className="text-neutral-400 max-w-lg">
						Join thousands of satisfied customers who trust Optima Bank for their financial needs.
					</p>
				</motion.div>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
				<motion.figure
					className="group relative rounded-xl overflow-hidden"
					initial={{ opacity: 0, y: 80 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0, ease: [0.19, 1, 0.22, 1] }}
					viewport={{ once: true }}
				>
					{/* Liquid Glass Card Background */}
					<div 
						className="absolute inset-0 rounded-xl"
						style={{
							background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
							backdropFilter: 'blur(20px)',
							border: '1px solid rgba(255,255,255,0.2)',
							boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 32px rgba(0,0,0,0.3)'
						}}
					>
						{/* Animated liquid gradient */}
						<div 
							className="absolute inset-0 opacity-30"
							style={{
								background: 'conic-gradient(from 0deg, rgba(255,125,0,0.3), rgba(236,28,36,0.2), rgba(255,255,255,0.1), rgba(139,92,246,0.2), rgba(255,215,0,0.3), rgba(255,107,53,0.2), rgba(138,43,226,0.3), rgba(255,125,0,0.3))',
								animation: 'spin 8s linear infinite',
								filter: 'blur(1px)'
							}}
						/>
						{/* Liquid distortion effect */}
						<div 
							className="absolute inset-0"
							style={{
								background: 'conic-gradient(from 45deg, transparent 0%, rgba(255,255,255,0.05) 25%, transparent 50%, rgba(255,255,255,0.02) 75%, transparent 100%)',
								animation: 'spin 12s linear infinite reverse',
								filter: 'blur(2px)'
							}}
						/>
					</div>
					
					{/* Content */}
					<div className="relative z-10 p-6">
						<div className="flex items-center gap-1 mb-4">
							{[...Array(5)].map((_, i) => (
								<svg key={i} className="w-5 h-5 text-[#ffcc4d]" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							))}
						</div>
						<blockquote className="text-neutral-200 text-lg leading-relaxed mb-4">"Optima Bank has transformed how I manage my finances. The app is intuitive and incredibly fast!"</blockquote>
						<figcaption className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold">S</div>
							<div>
								<div className="font-semibold text-white">Sarah Johnson</div>
								<div className="text-sm text-neutral-400">Freelancer</div>
							</div>
						</figcaption>
					</div>
				</motion.figure>
				
				<motion.figure
					className="group relative rounded-xl overflow-hidden"
					initial={{ opacity: 0, y: 80 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
					viewport={{ once: true }}
				>
					{/* Liquid Glass Card Background */}
					<div 
						className="absolute inset-0 rounded-xl"
						style={{
							background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
							backdropFilter: 'blur(20px)',
							border: '1px solid rgba(255,255,255,0.2)',
							boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 32px rgba(0,0,0,0.3)'
						}}
					>
						{/* Animated liquid gradient */}
						<div 
							className="absolute inset-0 opacity-30"
							style={{
								background: 'conic-gradient(from 0deg, rgba(255,125,0,0.3), rgba(236,28,36,0.2), rgba(255,255,255,0.1), rgba(139,92,246,0.2), rgba(255,215,0,0.3), rgba(255,107,53,0.2), rgba(138,43,226,0.3), rgba(255,125,0,0.3))',
								animation: 'spin 8s linear infinite',
								filter: 'blur(1px)'
							}}
						/>
						{/* Liquid distortion effect */}
						<div 
							className="absolute inset-0"
							style={{
								background: 'conic-gradient(from 45deg, transparent 0%, rgba(255,255,255,0.05) 25%, transparent 50%, rgba(255,255,255,0.02) 75%, transparent 100%)',
								animation: 'spin 12s linear infinite reverse',
								filter: 'blur(2px)'
							}}
						/>
					</div>
					
					{/* Content */}
					<div className="relative z-10 p-6">
						<div className="flex items-center gap-1 mb-4">
							{[...Array(5)].map((_, i) => (
								<svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							))}
						</div>
						<blockquote className="text-neutral-200 text-lg leading-relaxed mb-4">"The security features give me peace of mind. Best banking app I've ever used!"</blockquote>
						<figcaption className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">M</div>
							<div>
								<div className="font-semibold text-white">Marcus</div>
								<div className="text-sm text-neutral-400">Business Owner</div>
							</div>
						</figcaption>
					</div>
				</motion.figure>

				<motion.div
					className="rounded-xl border border-neutral-800 bg-gradient-to-br from-red-900/40 to-red-800/20 p-6 shadow-lg"
					initial={{ opacity: 0, y: 80 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 1, delay: 0.4, ease: [0.19, 1, 0.22, 1] }}
					viewport={{ once: true }}
				>
				<div className="text-center">
					<div className="text-3xl font-bold text-red-400 mb-2">
						<AnimatedCounter end={10000} duration={2.5} />+
					</div>
					<div className="text-sm text-neutral-400 mb-4">Happy Customers</div>
						<div className="text-sm text-neutral-400">Trusted by teams and partners worldwide</div>
						<div className="mt-4 flex justify-center items-center gap-4">
							<div className="h-8 w-16 rounded bg-gradient-to-r from-red-500 to-red-700" aria-label="Partner logo placeholder" />
							<div className="h-8 w-16 rounded bg-gradient-to-r from-red-600 to-red-800" aria-hidden="true" />
							<div className="h-8 w-16 rounded bg-gradient-to-r from-red-700 to-red-900" aria-hidden="true" />
						</div>
					</div>
				</motion.div>
				</div>
			</div>
		</section>
	);
}