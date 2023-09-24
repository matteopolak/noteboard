export function debounce(fn: Function, ms: number) {
	let timeout: NodeJS.Timeout;
	
	return function (...args) {
		clearTimeout(timeout);
	
		timeout = setTimeout(() => fn.apply(this, args), ms);
	};
}