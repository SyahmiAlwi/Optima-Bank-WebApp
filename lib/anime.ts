// Framer Motion animation utilities
import { motion, useAnimation, useInView } from "framer-motion";
import { useRef, useEffect } from "react";

export { motion, useAnimation, useInView };

// Animation variants for common patterns
export const fadeInUp = {
	initial: { opacity: 0, y: 50 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.6, ease: "easeOut" }
};

export const fadeInScale = {
	initial: { opacity: 0, scale: 0.8 },
	animate: { opacity: 1, scale: 1 },
	transition: { duration: 0.5, ease: "easeOut" }
};

export const slideInLeft = {
	initial: { opacity: 0, x: -50 },
	animate: { opacity: 1, x: 0 },
	transition: { duration: 0.6, ease: "easeOut" }
};

export const staggerContainer = {
	animate: {
		transition: {
			staggerChildren: 0.2
		}
	}
};

export const staggerItem = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5, ease: "easeOut" }
};

// Scroll-triggered animation hook
export function useScrollAnimation() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });
	const controls = useAnimation();

	useEffect(() => {
		if (isInView) {
			controls.start("animate");
		}
	}, [isInView, controls]);

	return { ref, controls };
}


