/**
 * Used to store the Result types of a Fragment.
 * This symbol is not used at runtime.
 */
export declare const FragmentResultTypeTag: unique symbol;
/**
 * Represents a projection fragment
 */
export type Fragment<
  TFragmentResult,
  _TFragmentInput, // (this type parameter is only included so it shows in an IDE)
  TProjectionMap
> = TProjectionMap & {
  // Track the result type, so we can extract it later:
  readonly [FragmentResultTypeTag]?: TFragmentResult;
};
/**
 * Infers the result types of a fragment.
 * @example
 * const productFragment = q.fragment<Product>().project({
 *   name: zod.string(),
 *   price: zod.number(),
 * });
 *
 * type ProductFragment = InferFragmentType<typeof productFragment>;
 */
export type InferFragmentType<TFragment extends Fragment<any, any, any>> =
  TFragment extends Fragment<
    infer TFragmentResult,
    infer _TFragmentInput,
    infer _TProjectionMap
  >
    ? TFragmentResult
    : never;
