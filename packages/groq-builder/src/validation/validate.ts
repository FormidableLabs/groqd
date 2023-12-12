import {
  InferParserInput,
  InferParserOutput,
  Parser,
  ParserFunction,
} from "../types/public-types";
import { normalizeValidationFunction } from "../commands/validate-utils";
import { ValidationErrors } from "./validation-errors";

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
  literal: <T>(literal: T) =>
    createOptionalParser<T, T>((input) => {
      if (input === literal) {
        return input;
      }
      throw new TypeError(
        `Expected ${inspect(literal)}, received ${inspect(input)}`
      );
    }),
  date: memo(() =>
    createOptionalParser<string, Date>((input) => {
      if (typeof input === "string") {
        const date = new Date(input);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      throw new TypeError(`Expected date, received ${inspect(input)}`);
    })
  ),

  object: <TMap extends Record<string, Parser>>(map: TMap) => {
    const keys = Object.keys(map) as Array<any>;
    const normalized = keys.map((key) => [
      key,
      normalizeValidationFunction(map[key]),
    ]);

    type ObjectInput = {
      [P in keyof TMap]: InferParserInput<TMap[P]>;
    };
    type ObjectOutput = {
      [P in keyof TMap]: InferParserOutput<TMap[P]>;
    };

    return createOptionalParser<ObjectInput, ObjectOutput>((input) => {
      if (input === null || typeof input !== "object") {
        throw new TypeError(`Expected an object, received ${inspect(input)}`);
      }

      const validationErrors = new ValidationErrors();

      const result: any = {};
      for (const [key, parse] of normalized) {
        const value = input[key];
        try {
          result[key] = parse(value);
        } catch (err) {
          validationErrors.add(key, value, err as Error);
        }
      }

      if (validationErrors.length) throw validationErrors;
      return result;
    });
  },

  array: <TParser extends Parser>(
    itemParser: TParser
  ): ParserFunction<
    Array<InferParserInput<TParser>>,
    Array<InferParserOutput<TParser>>
  > => {
    const normalizer = normalizeValidationFunction(itemParser);
    return createOptionalParser((input) => {
      if (!Array.isArray(input)) {
        throw new TypeError(`Expected array, received ${inspect(input)}`);
      }

      const validationErrors = new ValidationErrors();
      const results = input.map((value, i) => {
        try {
          return normalizer(value);
        } catch (err) {
          validationErrors.add(`[${i}]`, value, err as Error);
          return null;
        }
      });

      if (validationErrors.length) throw validationErrors;

      return results;
    });
  },

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
    throw new TypeError(`Expected ${type}, received ${inspect(input)}`);
  };
}
