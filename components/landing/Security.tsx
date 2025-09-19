"use client";

import { motion } from "framer-motion";
import { PulsingBorder } from "@paper-design/shaders-react";

export default function Security() {
	return (
		<section id="security" className="min-h-screen flex items-center justify-center mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="grid lg:grid-cols-2 gap-12 items-center w-full">
				<motion.div
					className="text-left max-w-lg mx-auto lg:mx-0"
					initial={{ opacity: 0, x: -50 }}
					whileInView={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					viewport={{ once: true }}
				>
					<h2 className="text-3xl font-bold text-white mb-4">Your Security, Our Priority</h2>
					<p className="text-neutral-300 mb-8">
						At Optima Bank, we employ state-of-the-art security measures to protect your financial information and privacy.
					</p>
					<div className="space-y-4">
					<motion.ul
						className="space-y-4"
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
						viewport={{ once: true }}
					>
						{[
							{
								title: "Bank-Level Encryption",
								description: "256-bit AES encryption to secure all your data and communications.",
								color: "emerald"
							},
							{
								title: "Fraud Protection",
								description: "Advanced algorithms and human oversight to detect and prevent fraudulent activities.",
								color: "blue"
							},
							{
								title: "Multi-Factor Authentication",
								description: "Secure your account with an extra layer of verification for every login.",
								color: "purple"
							}
						].map((feature, index) => (
							<motion.li
								key={index}
								className="relative group"
								initial={{ opacity: 0, x: -30 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{ 
									duration: 0.6, 
									delay: 0.3 + index * 0.1, 
									ease: "easeOut" 
								}}
								viewport={{ once: true }}
							>
								{/* Liquid Glass Card Background */}
								<div 
									className="absolute inset-0 rounded-xl overflow-hidden"
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
								<div className="relative z-10 flex items-start gap-3 p-4">
									<span className={`inline-flex items-center justify-center h-6 w-6 rounded-full bg-${feature.color}-500/20 text-${feature.color}-300 flex-shrink-0`}>
										<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									</span>
									<div>
										<h3 className="text-lg font-semibold text-white">{feature.title}</h3>
										<p className="text-neutral-300">{feature.description}</p>
									</div>
								</div>
							</motion.li>
						))}
					</motion.ul>
					</div>
				</motion.div>
				<motion.div
					className="flex items-center justify-center"
					initial={{ opacity: 0, x: 50 }}
					whileInView={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					viewport={{ once: true }}
				>
					<div className="relative flex items-center justify-center">
						{/* Pulsing Circle Element - positioned to cover the logo */}
						<div className="absolute -top-16 -left-16 w-64 h-64 flex items-center justify-center">
							<PulsingBorder
								colors={["#ff7d00", "#ec1c24", "#ffffff", "#8b5cf6", "#ffd700", "#ff6b35", "#8A2BE2"]}
								colorBack="#00000000"
								speed={1.5}
								roundness={1}
								thickness={0.1}
								softness={0.2}
								intensity={5}
								spotSize={0.1}
								pulse={0.1}
								smoke={0.5}
								smokeSize={4}
								scale={0.8}
								rotation={0}
								style={{
									width: "256px",
									height: "256px",
									borderRadius: "50%",
								}}
							/>
						</div>
						<img 
							src="/logo-bg-removed.png" 
							alt="Optima Bank" 
							className="relative h-32 w-auto z-10" 
						/>
					</div>
				</motion.div>
			</div>
		</section>
	);
}