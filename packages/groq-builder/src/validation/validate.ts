import { ParserFunction } from "../types/public-types";

function memo<T extends () => any>(fn: T): T {
  let result: ReturnType<T>;
  return (() => result || (result = fn())) as T;
}

function inspect(value: unknown): string {
  if (value) {
    if (Array.isArray(value)) return "an Array";
    if (typeof value === "object") return "an object";
  }
  return JSON.stringify(value);
}

export type OptionalParser<TInput, TOutput> = ParserFunction<
  TInput,
  TOutput
> & {
  optional(): <TInputMaybe extends TInput | null | undefined>(
    input: TInputMaybe
  ) => TOutput | Extract<TInputMaybe, null | undefined>;
};

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

export const validate = {
  literal<T>(literal: T) {
    return createOptionalParser<T, T>((input) => {
      if (input === literal) {
        return input;
      }
      throw new TypeError(
        `Expected ${inspect(literal)}, but got ${inspect(input)}`
      );
    });
  },
  date: memo(() =>
    createOptionalParser<string, Date>((input) => {
      if (typeof input === "string") {
        const date = new Date(input);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      throw new TypeError(`Expected a date, but got ${inspect(input)}`);
    })
  ),

  string: memo(() => createOptionalParser(typeValidator("string"))),
  boolean: memo(() => createOptionalParser(typeValidator("boolean"))),
  number: memo(() => createOptionalParser(typeValidator("number"))),
  bigint: memo(() => createOptionalParser(typeValidator("bigint"))),
  undefined: memo(() => createOptionalParser(typeValidator("undefined"))),
};

type TypeValidators = {
  string: string;
  boolean: boolean;
  number: number;
  bigint: bigint;
  undefined: undefined;
};
function typeValidator<TypeName extends keyof TypeValidators>(
  type: TypeName
): ParserFunction<TypeValidators[TypeName], TypeValidators[TypeName]> {
  return (input) => {
    if (typeof input === type) {
      return input;
    }
    throw new TypeError(`Expected a ${type}, but got ${inspect(input)}`);
  };
}
