"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { analytics } from "@/lib/analytics";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

export default function Hero() {
	const { scrollY } = useScroll();
	const y = useTransform(scrollY, [0, 500], [0, -150]);
	const opacity = useTransform(scrollY, [0, 300], [1, 0]);

	return (
		<section className="relative overflow-hidden min-h-screen flex items-start pt-20 md:pt-28">
			<div className="absolute inset-0 pointer-events-none">
				<svg className="h-full w-full opacity-40" viewBox="0 0 1440 560" aria-hidden="true">
					<defs>
						<linearGradient id="heroStroke" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="#ff7d00" />
							<stop offset="100%" stopColor="#ec1c24" />
						</linearGradient>
					</defs>
					<motion.path
						d="M0,320 C240,260 320,200 480,240 C640,280 720,360 900,320 C1080,280 1200,160 1440,200"
						fill="none"
						stroke="url(#heroStroke)"
						strokeWidth="2"
						strokeLinecap="round"
						initial={{ pathLength: 0, opacity: 0 }}
						animate={{ pathLength: 1, opacity: 1 }}
						transition={{ 
							duration: 3, 
							ease: [0.25, 0.46, 0.45, 0.94],
							delay: 0.5
						}}
					/>
				</svg>
			</div>

			<motion.div 
				className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
				style={{ y, opacity }}
			>
				<div className="max-w-3xl mx-auto text-center">
					<motion.div
						className="relative mb-8 mx-auto w-fit"
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
					>
						{/* Enhanced glow layers */}
						<div className="absolute inset-0 -m-4">
							{/* Outer glow */}
							<div className="absolute inset-0 bg-gradient-to-r from-[#ff7d00]/15 via-[#ff7d00]/25 to-[#ec1c24]/15 rounded-full blur-xl animate-pulse" />
							{/* Middle glow */}
							<div className="absolute inset-0 bg-gradient-to-r from-[#ff7d00]/20 via-[#ffffff]/15 to-[#ec1c24]/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.5s' }} />
							{/* Inner glow */}
							<div className="absolute inset-0 bg-gradient-to-r from-[#ff7d00]/30 via-[#ffffff]/20 to-[#ec1c24]/30 rounded-full blur-md animate-pulse" style={{ animationDelay: '1s' }} />
						</div>
						<motion.img
							src="/optima-header.png"
							alt="Optima Bank"
							className="relative h-12 w-auto drop-shadow-[0_0_20px_rgba(255,125,0,0.6)] drop-shadow-[0_0_40px_rgba(255,125,0,0.4)] drop-shadow-[0_0_60px_rgba(255,125,0,0.3)] hover:drop-shadow-[0_0_30px_rgba(255,125,0,0.8)] transition-all duration-500 z-10"
							whileHover={{ scale: 1.05 }}
							transition={{ duration: 0.3 }}
						/>
					</motion.div>
					<motion.h1
						className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
					>
						Banking, designed for your everyday growth.
					</motion.h1>
					<motion.p
						className="mt-4 text-neutral-200 text-lg sm:text-xl max-w-2xl mx-auto"
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
					>
						Open an account in minutes, track spending effortlessly, and save on fees—secured by bank-grade protection.
					</motion.p>
                    {/* Removed public FAQ disclaimer per request */}
                            <motion.div
                                className="mt-8 flex flex-wrap items-center justify-center gap-3"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                            >
                                <Link
                                    href="/auth"
                                    className="px-8 py-4 rounded-lg bg-[#ff7d00] text-white hover:bg-[#ff8000] transition-all duration-300 hover:scale-105 hover:shadow-lg text-lg font-medium"
                                    onClick={() => analytics.track("hero_cta_click")}
                                >
                                    Open an Account
                                </Link>
                                <ShimmerButton
                                    shimmerColor="#ffffff"
                                    background="rgba(0, 0, 0, 1)"
                                    borderRadius="100px"
                                    shimmerDuration="2.5s"
                                    shimmerSize="0.03em"
                                    className="px-8 py-4 text-lg font-medium border-white/20 hover:border-white/40"
                                    onClick={() => window.location.href = '/auth'}
                                >
                                    Log in
                                </ShimmerButton>
                            </motion.div>
					<motion.ul
						className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-400"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
					>
						<motion.li
							className="flex items-center gap-3"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
						>
							<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
							</svg>
							End-to-end encryption
						</motion.li>
						<motion.li
							className="flex items-center gap-3"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 1.1, ease: "easeOut" }}
						>
							<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
							</svg>
							Regulated partner bank
						</motion.li>
						<motion.li
							className="flex items-center gap-3"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
						>
							<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
							</svg>
							24/7 support
						</motion.li>
					</motion.ul>
				</div>
			</motion.div>
		</section>
	);
}