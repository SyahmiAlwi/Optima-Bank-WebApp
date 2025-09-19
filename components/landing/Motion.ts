"use client";

type Play = () => void;

export const Motion = {
	get reduced() {
		if (typeof window === "undefined") return false;
		return (
			window.matchMedia &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		);
	},
	observeOnce(el: Element, play: Play, options?: IntersectionObserverInit) {
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						play();
						io.disconnect();
						break;
					}
				}
			},
			{ root: null, threshold: 0.2, ...(options || {}) }
		);
		io.observe(el);
		return () => io.disconnect();
	},
	onScrollPast(px: number, fn: () => void) {
		let fired = false;
		const handler = () => {
			if (!fired && window.scrollY > px) {
				fired = true;
				fn();
		window.removeEventListener("scroll", handler);
	}
};
window.addEventListener("scroll", handler, { passive: true });
return () => window.removeEventListener("scroll", handler);
	},
	playOrFade(el: Element, play: Play) {
		if (this.reduced) {
			(el as HTMLElement).style.transition = "opacity 150ms ease-out";
			(el as HTMLElement).style.opacity = "1";
			return;
		}
		play();
	},
};


