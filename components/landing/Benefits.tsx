"use client";

import { motion } from "framer-motion";

const benefits = [
	{
		title: "Open an account in minutes",
		description: "Our streamlined application process gets you started in no time, with minimal paperwork.",
		icon: "1",
	},
	{
		title: "Send money anywhere, instantly",
		description: "Transfer funds globally with competitive rates and real-time tracking, right from your phone.",
		icon: "2",
	},
	{
		title: "Track every dollar, effortlessly",
		description: "Gain full control with detailed spending insights, budgeting tools, and instant transaction alerts.",
		icon: "3",
	},
	{
		title: "Bank-level security, always",
		description: "Your funds and data are protected with advanced encryption and fraud prevention technologies.",
		icon: "4",
	},
];

export default function Benefits() {
	return (
		<section id="features" className="min-h-screen flex items-center justify-center mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<div className="grid lg:grid-cols-2 gap-12 items-center w-full">
				<motion.div
					className="text-left"
					initial={{ opacity: 0, x: -50 }}
					whileInView={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					viewport={{ once: true }}
				>
					<h2 className="text-3xl font-bold text-white mb-4">Why Choose Optima Bank?</h2>
					<p className="text-neutral-400 max-w-lg">
						Discover the advantages of banking with Optima Bank. We offer a seamless experience designed for you.
					</p>
				</motion.div>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
				{benefits.map((benefit, i) => (
					<motion.div
						key={i}
						className="group rounded-xl border border-neutral-700 bg-gradient-to-br from-[#4a0a52] to-[#2f0037] p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-[#ff7d00] hover:shadow-[#ff7d00]/20"
						initial={{ opacity: 0, y: 100, scale: 0.8 }}
						whileInView={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ 
							duration: 0.8, 
							delay: i * 0.2, 
							ease: [0.25, 0.46, 0.45, 0.94] 
						}}
						viewport={{ once: true }}
						whileHover={{ 
							scale: 1.05,
							y: -8,
							transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
						}}
					>
						<motion.div
						className="card-icon mb-4 h-12 w-12 rounded-lg bg-gradient-to-br from-[#ff7d00] to-[#ec1c24] flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300"
							initial={{ rotate: 0, scale: 0.8 }}
							whileInView={{ rotate: 360, scale: 1 }}
							transition={{ 
								duration: 0.6, 
								delay: i * 0.2 + 0.3, 
								ease: [0.25, 0.46, 0.45, 0.94] 
							}}
							viewport={{ once: true }}
						>
							{benefit.icon}
						</motion.div>
						<h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
						<p className="text-neutral-300">{benefit.description}</p>
					</motion.div>
				))}
				</div>
			</div>
		</section>
	);
}