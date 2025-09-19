"use client";

import { motion } from "framer-motion";

export default function Product() {
	return (
		<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<motion.div
				className="text-center mb-12"
				initial={{ opacity: 0, y: 50 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				viewport={{ once: true }}
			>
				<h2 className="text-3xl font-bold text-white mb-4">Product Highlights</h2>
				<p className="text-neutral-400 max-w-2xl mx-auto">
					Explore the powerful features that make Optima Bank your ideal financial partner.
				</p>
			</motion.div>
			<div className="grid items-center gap-12 lg:grid-cols-2">
				<div className="lg:order-2">
					<div className="grid grid-cols-2 gap-4">
						{[
							{ src: "/vercel.svg", alt: "Dashboard screenshot placeholder" },
							{ src: "/next.svg", alt: "Transactions screenshot placeholder" },
							{ src: "/optima-header.png", alt: "Savings screenshot placeholder" },
							{ src: "/th.svg", alt: "Budgeting screenshot placeholder" }
						].map((screenshot, idx) => (
							<motion.div
								key={idx}
								className={`overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 shadow-lg ${
									idx === 1 || idx === 3 ? "mt-8" : ""
								}`}
								initial={{ opacity: 0, y: 50, scale: 0.9 }}
								whileInView={{ opacity: 1, y: 0, scale: 1 }}
								transition={{ 
									duration: 0.8, 
									delay: idx * 0.2, 
									ease: [0.19, 1, 0.22, 1] 
								}}
								viewport={{ once: true }}
							>
								<motion.img
									src={screenshot.src}
									alt={screenshot.alt}
									className="h-64 w-full object-contain"
									loading="lazy"
									initial={{ scale: 0.8, opacity: 0 }}
									whileInView={{ scale: 1, opacity: 1 }}
								transition={{ 
									duration: 0.6, 
									delay: idx * 0.2 + 0.3, 
									ease: [0.25, 0.46, 0.45, 0.94] 
								}}
									viewport={{ once: true }}
								/>
							</motion.div>
						))}
					</div>
				</div>
				<div className="lg:order-1">
					<motion.ul
						className="space-y-6"
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						viewport={{ once: true }}
					>
						{[
							{
								title: "Real-time Notifications",
								description: "Stay informed with instant alerts for all your transactions and account activity.",
								color: "emerald"
							},
							{
								title: "Secure Transactions",
								description: "Our advanced security protocols ensure your money and data are always safe.",
								color: "blue"
							},
							{
								title: "Easy Transfers & Payments",
								description: "Send money to friends, pay bills, and manage subscriptions with just a few taps.",
								color: "purple"
							}
						].map((feature, index) => (
							<motion.li
								key={index}
								className="flex items-start gap-3"
								initial={{ opacity: 0, x: -50, scale: 0.8 }}
								whileInView={{ opacity: 1, x: 0, scale: 1 }}
								transition={{ 
									duration: 0.8, 
									delay: index * 0.15, 
									ease: [0.25, 0.46, 0.45, 0.94] 
								}}
								viewport={{ once: true }}
							>
								<span className={`inline-flex items-center justify-center h-6 w-6 rounded-full bg-${feature.color}-100 text-${feature.color}-600 flex-shrink-0`}>
									<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
								</span>
								<div>
									<h3 className="text-lg font-semibold text-white">{feature.title}</h3>
									<p className="text-neutral-400">{feature.description}</p>
								</div>
							</motion.li>
						))}
					</motion.ul>
				</div>
			</div>
		</section>
	);
}