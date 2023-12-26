export function filterNulls<T>(items: readonly (T | null | undefined)[]): T[] {
  return items.filter((item) => item != null) as T[];
}
