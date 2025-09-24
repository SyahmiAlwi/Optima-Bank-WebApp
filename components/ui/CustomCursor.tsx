"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const [isHovering, setIsHovering] = useState(false);
	const [isClicking, setIsClicking] = useState(false);

	useEffect(() => {
		const updateMousePosition = (e: MouseEvent) => {
			setMousePosition({ x: e.clientX, y: e.clientY });
		};

		const handleMouseDown = () => setIsClicking(true);
		const handleMouseUp = () => setIsClicking(false);

		// Add hover listeners for interactive elements
		const handleMouseOver = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (
				target.tagName === "BUTTON" ||
				target.tagName === "A" ||
				target.closest("button") ||
				target.closest("a") ||
				target.closest("[data-cursor-hover]")
			) {
				setIsHovering(true);
			}
		};

		const handleMouseOut = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (
				target.tagName === "BUTTON" ||
				target.tagName === "A" ||
				target.closest("button") ||
				target.closest("a") ||
				target.closest("[data-cursor-hover]")
			) {
				setIsHovering(false);
			}
		};

		window.addEventListener("mousemove", updateMousePosition);
		window.addEventListener("mousedown", handleMouseDown);
		window.addEventListener("mouseup", handleMouseUp);
		window.addEventListener("mouseover", handleMouseOver);
		window.addEventListener("mouseout", handleMouseOut);

		return () => {
			window.removeEventListener("mousemove", updateMousePosition);
			window.removeEventListener("mousedown", handleMouseDown);
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("mouseover", handleMouseOver);
			window.removeEventListener("mouseout", handleMouseOut);
		};
	}, []);

	return (
		<>
			{/* Main cursor */}
			<motion.div
				className="fixed top-0 left-0 pointer-events-none z-50 mix-blend-difference"
				animate={{
					x: mousePosition.x - 8,
					y: mousePosition.y - 8,
				}}
				transition={{
					type: "spring",
					stiffness: 500,
					damping: 28,
				}}
			>
				<motion.div
					className="w-4 h-4 rounded-full bg-white"
					animate={{
						scale: isHovering ? 1.5 : isClicking ? 0.8 : 1,
						opacity: isHovering ? 0.8 : 1,
					}}
					transition={{
						duration: 0.2,
						ease: "easeOut",
					}}
				/>
			</motion.div>

			{/* Cursor trail */}
			<motion.div
				className="fixed top-0 left-0 pointer-events-none z-40"
				animate={{
					x: mousePosition.x - 20,
					y: mousePosition.y - 20,
				}}
				transition={{
					type: "spring",
					stiffness: 150,
					damping: 20,
				}}
			>
				<motion.div
					className="w-10 h-10 rounded-full border-2 border-red-500"
					animate={{
						scale: isHovering ? 1.2 : isClicking ? 0.9 : 1,
						opacity: isHovering ? 0.6 : 0.3,
					}}
					transition={{
						duration: 0.3,
						ease: "easeOut",
					}}
				/>
			</motion.div>

			{/* Outer ring */}
			<motion.div
				className="fixed top-0 left-0 pointer-events-none z-30"
				animate={{
					x: mousePosition.x - 30,
					y: mousePosition.y - 30,
				}}
				transition={{
					type: "spring",
					stiffness: 100,
					damping: 25,
				}}
			>
				<motion.div
					className="w-16 h-16 rounded-full border border-red-400/30"
					animate={{
						scale: isHovering ? 1.1 : isClicking ? 0.95 : 1,
						opacity: isHovering ? 0.4 : 0.1,
					}}
					transition={{
						duration: 0.4,
						ease: "easeOut",
					}}
				/>
			</motion.div>
		</>
	);
}


