export function unstable_cache<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  _keyParts?: unknown,
  _options?: unknown
) {
  return fn;
}

export function revalidateTag(_tag: string) {
  // no-op outside Next.js
}

export function revalidatePath(_path: string) {
  // no-op outside Next.js
}
