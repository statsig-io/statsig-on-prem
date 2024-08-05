export type HashFn = (input: string) => string;

let hash_fn: HashFn = djb2Hash;

export default class HashUtils {
  public static hashString(str: string): string {
    return hash_fn(str);
  }

  public static setHashFn(fn: HashFn): void {
    hash_fn = fn;
  }
}

function fasthash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const character = value.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function djb2Hash(value: string): string {
  return String(fasthash(value) >>> 0);
}
