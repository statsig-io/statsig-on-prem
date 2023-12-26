export default class HashUtils {
  public static hashString(str: string): string {
    return this.djb2Hash(str);
  }

  private static fasthash(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const character = value.charCodeAt(i);
      hash = (hash << 5) - hash + character;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  private static djb2Hash(value: string): string {
    return String(this.fasthash(value) >>> 0);
  }
}
