import { ExtractProjectionResult } from "./projection-types";
import { QueryConfig } from "./query-config";
import { Simplify } from "./utils";

export declare type FragmentMetadataKeys = typeof BaseType | typeof Config;
declare const BaseType: unique symbol;
declare const Config: unique symbol;

/**
 * This is used to capture metadata for the fragment's base types,
 * to be extracted later by `InferFragmentType`
 */
type FragmentBaseType<TFragmentInput, TQueryConfig extends QueryConfig> = {
  readonly [BaseType]?: TFragmentInput;
  readonly [Config]?: TQueryConfig;
};

/**
 * A Fragment is an object that can be used in a projection.
 */
export type Fragment<
  TFragmentInput,
  TQueryConfig extends QueryConfig,
  TProjectionMap
> = FragmentBaseType<TFragmentInput, TQueryConfig> & TProjectionMap;

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
