import { ParserFunction } from "../types/public-types";

export const primitives = {
  string: memo(() => createTypeValidator("string")),
  boolean: memo(() => createTypeValidator("boolean")),
  number: memo(() => createTypeValidator("number")),
  bigint: memo(() => createTypeValidator("bigint")),
  undefined: memo(() => createTypeValidator("undefined")),

  unknown: () => createOptionalParser((input: unknown) => input),

  literal: <T>(literal: T) =>
    createOptionalParser<T, T>((input) => {
      if (input !== literal) {
        throw new TypeError(
          `Expected ${inspect(literal)}, received ${inspect(input)}`
        );
      }
      return input;
    }),

  date: memo(() =>
    createOptionalParser<string, Date>((input) => {
      if (typeof input === "string") {
        const date = new Date(input);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      throw new TypeError(`Expected a date, received ${inspect(input)}`);
    })
  ),

  object: <TObject extends object>() =>
    createOptionalParser<TObject, TObject>((input) => {
      if (typeof input !== "object" || input === null) {
        throw new TypeError(`Expected an object, received ${inspect(input)}`);
      }
      return input;
    }),

  array: <TArray extends Array<any>>() =>
    createOptionalParser<TArray, TArray>((input) => {
      if (!Array.isArray(input)) {
        throw new TypeError(`Expected an array, received ${inspect(input)}`);
      }
      return input;
    }),
};

/**
 * Super-simple function memoizer; does not support args
 * @param fn
 */
export function memo<T extends () => any>(fn: T): T {
  let result: ReturnType<T>;
  return (() => result || (result = fn())) as T;
}

export function inspect(value: unknown): string {
  if (value) {
    if (Array.isArray(value)) return "an Array";
    if (typeof value === "object") return "an object";
  }
  return JSON.stringify(value);
}

export function createOptionalParser<TInput, TOutput>(
  check: ParserFunction<TInput, TOutput>
): OptionalParser<TInput, TOutput> {
  const parser = check as OptionalParser<TInput, TOutput>;
  parser.optional = () => (input) => {
    // Allow nullish values:
    if (input === undefined || input === null) {
      return input as Extract<typeof input, null | undefined>;
    }
    return check(input);
  };
  return parser;
}

export type OptionalParser<TInput, TOutput> = ParserFunction<
  TInput,
  TOutput
> & {
  optional(): <TInputMaybe extends TInput | null | undefined>(
    input: TInputMaybe
  ) => TOutput | Extract<TInputMaybe, null | undefined>;
};

type TypeValidators = {
  string: string;
  boolean: boolean;
  number: number;
  bigint: bigint;
  undefined: undefined;
};
function createTypeValidator<TypeName extends keyof TypeValidators>(
  type: TypeName
) {
  return createOptionalParser<
    TypeValidators[TypeName],
    TypeValidators[TypeName]
  >((input) => {
    if (typeof input !== type) {
      throw new TypeError(`Expected ${type}, received ${inspect(input)}`);
    }
    return input;
  });
}
