// This file was copied from:
// https://github.com/saiichihashimoto/sanity-typed/blob/main/packages/test-utils/src/index.ts
export type IsEqual<A, B> = (<G>() => G extends A ? 1 : 2) extends <
  G
>() => G extends B ? 1 : 2
  ? true
  : false;

//
declare const RECEIVED: unique symbol;
declare const EXPECTED: unique symbol;
declare const ERROR: unique symbol;

type Negate<Value extends boolean> = Value extends true ? false : true;

type IsAssignable<Received, Expected> = [Received] extends [Expected]
  ? true
  : false;

type SimplifyDeep<Type> = Type extends Promise<infer T>
  ? Promise<SimplifyDeep<T>>
  : Type extends any[]
  ? { [index in keyof Type]: SimplifyDeep<Type[index]> }
  : { [key in keyof Type]: SimplifyDeep<Type[key]> };

type IsSimplyEqual<Received, Expected> = IsEqual<
  SimplifyDeep<Received>,
  SimplifyDeep<Expected>
>;

declare const inverted: unique symbol;

type TypeMatchers<Received, Inverted extends boolean = false> = {
  [inverted]: Inverted;
  /** Inverse next matcher. If you know how to test something, .not lets you test its opposite. */
  not: TypeMatchers<Received, Negate<Inverted>>;
  /**
   * Checks if Received is assignable to Expected.
   *
   * @example
   * ```typescript
   * // Equivalent Checks:
   * expectType<typeof a>().toBeAssignableTo<B>();
   *
   * const something: B = a;
   * ```
   */
  toBeAssignableTo: <
    Expected extends IsAssignable<Received, Expected> extends Negate<Inverted>
      ? any
      : Received & {
          [ERROR]: Negate<Inverted> extends true
            ? "Types should not be assignable"
            : "Types should be assignable";
        }
  >(
    ...args: IsAssignable<Received, Expected> extends Negate<Inverted>
      ? []
      : [
          error: {
            [ERROR]: Negate<Inverted> extends true
              ? "Types should not be assignable"
              : "Types should be assignable";
            [RECEIVED]: Received;
            [EXPECTED]: Expected;
          }
        ]
  ) => void;
  /**
   * Checks if Received and Expected are exactly the same type after Simplify.
   *
   * Super duper experimental.
   */
  toEqual: <
    Expected extends IsSimplyEqual<Received, Expected> extends Negate<Inverted>
      ? any
      : SimplifyDeep<Received> & {
          [ERROR]: Negate<Inverted> extends true
            ? "Types should not be equal"
            : "Types should be equal";
        }
  >(
    ...args: IsSimplyEqual<Received, Expected> extends Negate<Inverted>
      ? []
      : [
          error: {
            [ERROR]: Negate<Inverted> extends true
              ? "Types should not be equal"
              : "Types should be equal";
            [RECEIVED]: SimplifyDeep<Received>;
            [EXPECTED]: SimplifyDeep<Expected>;
          }
        ]
  ) => void;
  /**
   * Checks if Received and Expected are exactly the same type.
   */
  toStrictEqual: <
    Expected extends IsEqual<Received, Expected> extends Negate<Inverted>
      ? any
      : Received & {
          [ERROR]: Negate<Inverted> extends true
            ? "Types should not be strict equal"
            : "Types should be strict equal";
        }
  >(
    ...args: IsEqual<Received, Expected> extends Negate<Inverted>
      ? []
      : [
          error: {
            [ERROR]: Negate<Inverted> extends true
              ? "Types should not be strict equal"
              : "Types should be strict equal";
            [RECEIVED]: Received;
            [EXPECTED]: Expected;
          }
        ]
  ) => void;
};

export const expectType = <Received>() => {
  const valWithoutNot: Omit<TypeMatchers<Received>, typeof inverted | "not"> = {
    toBeAssignableTo: () => {
      /**/
    },
    toEqual: () => {
      /**/
    },
    toStrictEqual: () => {
      /**/
    },
  };

  const val = valWithoutNot as TypeMatchers<Received>;

  //// eslint-disable-next-line fp/no-mutation -- recursion requires mutation
  val.not = val as unknown as typeof val.not;

  return val;
};
