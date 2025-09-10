/// <reference types="vite/client" />

// Allow importing plain CSS (Vite provides actual handling at build time)
declare module '*.css';

// Generic declarations for common asset types (optional safety)
declare module '*.svg' {
	const src: string;
	export default src;
}
declare module '*.png' {
	const src: string;
	export default src;
}
declare module '*.jpg' {
	const src: string;
	export default src;
}
declare module '*.jpeg' {
	const src: string;
	export default src;
}
declare module '*.gif' {
	const src: string;
	export default src;
}
