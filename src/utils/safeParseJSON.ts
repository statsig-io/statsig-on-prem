export function safeParseJSON<T>(data: string | undefined, fallback: T): T {
  try {
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
}
