export class ExhaustSwitchError extends Error {
  constructor(x: never) {
    super(`Unreachable case: ${JSON.stringify(x)}`);
  }
}

export function assertNeverX(x: never): never {
  throw new ExhaustSwitchError(x);
}
