export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number, maxWait: number = ms * 5) {
  let timeout: NodeJS.Timeout;
	let lastFire = Date.now();

  type FunctionTypes = Parameters<typeof fn>;

  return (...args: FunctionTypes) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
			lastFire = Date.now();
			// @ts-ignore
			fn.apply(this, args);
		}, Math.max(0, Math.min(ms, maxWait - (Date.now() - lastFire))));
  };
}
