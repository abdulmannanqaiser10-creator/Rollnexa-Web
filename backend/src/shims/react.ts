export function cache<T extends (...args: never[]) => unknown>(fn: T) {
  return fn;
}
