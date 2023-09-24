export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timeout: NodeJS.Timeout;

  type FunctionTypes = Parameters<typeof fn>;

  return (...args: FunctionTypes) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => fn.apply(this, args), ms);
  };
}
