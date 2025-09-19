export const analytics = {
	track(event: string, payload?: Record<string, any>) {
		if (typeof window !== "undefined") {
			// eslint-disable-next-line no-console
			console.log("[analytics]", event, payload || {});
		}
	},
};


