import { ExtractProjectionResult } from "./projection-types";
import { QueryConfig } from "./query-config";
import { Simplify } from "./utils";

export declare type FragmentMetadata =
  | typeof FragmentInputTypeTag
  | typeof FragmentQueryConfigTypeTag;
declare const FragmentInputTypeTag: unique symbol;
declare const FragmentQueryConfigTypeTag: unique symbol;
/**
 * Represents a projection fragment
 */
export type Fragment<
  TFragmentInput, // These are used to capture the type, to be extracted by `InferFragmentType`
  TQueryConfig extends QueryConfig,
  TProjectionMap
> = TProjectionMap & {
  readonly [FragmentInputTypeTag]?: TFragmentInput;
  readonly [FragmentQueryConfigTypeTag]?: TQueryConfig;
};
/**
 * Infers the result types of a fragment.
 * @example
 * const productFragment = q.fragment<Product>().project({
 *   name: z.string(),
 *   price: z.number(),
 * });
 *
 * type ProductFragment = InferFragmentType<typeof productFragment>;
 */
export type InferFragmentType<TFragment extends Fragment<any, any, any>> =
  TFragment extends Fragment<
    infer TFragmentInput,
    infer TQueryConfig,
    infer TProjectionMap
  >
    ? Simplify<
        ExtractProjectionResult<TFragmentInput, TQueryConfig, TProjectionMap>
      >
    : never;
