export async function genFilter<T>(
  arr: T[],
  predicate: (val: T) => Promise<boolean>
): Promise<T[]> {
  const mapped = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => mapped[index]);
}
