import type { IsNever, Simplify } from "type-fest";
import { JustOneOf, StringKeys, ValueOf } from "./utils";

export type TypeMismatchError<
  TError extends { error: string; actual: any; expected: any } = any
> = {
  error: TError["error"];
  actual: Simplify<TError["actual"]>;
  expected: Simplify<TError["expected"]>;
};
/**
 * Extracts all TypeMismatchError's from the projection result,
 * making it easy to report these errors.
 * Returns a string of error messages,
 * or `never` if there are no errors.
 */
export type ExtractTypeMismatchErrors<TProjectionResult> = ValueOf<{
  [TKey in StringKeys<
    keyof TProjectionResult
  >]: TypeMismatchError extends TProjectionResult[TKey]
    ? Extract<TProjectionResult[TKey], TypeMismatchError>["error"]
    : never;
}>;

/**
 * When we map projection results, we return TypeMismatchError's
 * for any fields that have an invalid mapping configuration.
 * However, this does not cause TypeScript to throw any errors.
 *
 * In order to get TypeScript to complain about these invalid mappings,
 * we will "require" an extra parameter, which will reveal the error messages.
 */
export type RequireAFakeParameterIfThereAreTypeMismatchErrors<
  TProjectionResult,
  _Errors extends string = ExtractTypeMismatchErrors<TProjectionResult>
> = IsNever<_Errors> extends true
  ? [] // No errors, yay! Do not require any extra parameters.
  : // We've detected errors in the projection;
    // let's require a fake extra parameter,
    // which includes these error messages:
    | ["⛔️ Error: this projection has an invalid property ⛔️"]
      // We only include ONE of the actual error messages,
      // because if we include too many, TS doesn't show them properly
      | [JustOneOf<_Errors>];
