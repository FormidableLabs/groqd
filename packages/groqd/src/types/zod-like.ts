/**
 * This file avoids referencing Zod directly,
 * so that we focus on the bare minimum types needed.
 */

/**
 * Represents any Zod-like schema
 */
export type ZodType<Output, Def, Input> = {
  readonly _output: Output;
  readonly _input: Input;
  readonly _def: Def;
  parse(input: unknown, ...params: any[]): Output;
};

/**
 * Determines if the error is Zod-like
 */
export function isZodError(err: Error): err is ZodError {
  const errZ = err as ZodError;
  return (
    Array.isArray(errZ.errors) &&
    Array.isArray(errZ.issues) &&
    typeof errZ.isEmpty === "boolean"
  );
}

type ZodError = Error & {
  errors: Array<{ path: string[]; message: string }>;
  issues: any[];
  isEmpty: boolean;
};
