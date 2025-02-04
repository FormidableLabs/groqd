import { describe, expectTypeOf, it } from "vitest";
import { Expressions } from "./groq-expressions";
import { QueryConfig } from "./query-config";
import { Simplify } from "./utils";

type FooBarBaz = { foo: string; bar: number; baz: boolean };

describe("Expressions", () => {
  it("literal values are properly escaped", () => {
    expectTypeOf<
      Expressions.Equality<{ foo: "FOO" }, QueryConfig>
    >().toEqualTypeOf<'foo == "FOO"'>();
    expectTypeOf<
      Expressions.Equality<{ foo: 999 }, QueryConfig>
    >().toEqualTypeOf<"foo == 999">();
    expectTypeOf<
      Expressions.Equality<{ foo: true }, QueryConfig>
    >().toEqualTypeOf<"foo == true">();
    expectTypeOf<
      Expressions.Equality<{ foo: null }, QueryConfig>
    >().toEqualTypeOf<"foo == null">();
  });
  it("primitive values are properly typed", () => {
    expectTypeOf<
      Expressions.Equality<{ foo: string }, QueryConfig>
    >().toEqualTypeOf<`foo == "${string}"` | "foo == (string)">();
    expectTypeOf<
      Expressions.Equality<{ foo: number }, QueryConfig>
    >().toEqualTypeOf<`foo == ${number}` | "foo == (number)">();
    expectTypeOf<
      Expressions.Equality<{ foo: boolean }, QueryConfig>
    >().toEqualTypeOf<"foo == true" | "foo == false">();
    expectTypeOf<
      Expressions.Equality<{ foo: null }, QueryConfig>
    >().toEqualTypeOf<`foo == null`>();
  });

  it("multiple literals", () => {
    expectTypeOf<
      Expressions.Equality<{ foo: "FOO"; bar: 999 }, QueryConfig>
    >().toEqualTypeOf<'foo == "FOO"' | "bar == 999">();
  });
  it("multiple primitives", () => {
    expectTypeOf<
      Expressions.Equality<{ foo: string; bar: number }, QueryConfig>
    >().toEqualTypeOf<
      | "foo == (string)"
      | `foo == "${string}"`
      | "bar == (number)"
      | `bar == ${number}`
    >();
  });
  it("mixed types", () => {
    expectTypeOf<
      Expressions.Equality<{ foo: "FOO"; bar: number }, QueryConfig>
    >().toEqualTypeOf<
      'foo == "FOO"' | "bar == (number)" | `bar == ${number}`
    >();
  });

  describe("with parameters", () => {
    type WithVars<TVars> = QueryConfig & { parameters: TVars };

    it("a literal value can be compared to parameters with the same type", () => {
      expectTypeOf<
        Expressions.Equality<{ foo: "FOO" }, WithVars<{ str: string }>>
      >().toEqualTypeOf<'foo == "FOO"' | "foo == $str">();
      expectTypeOf<
        Expressions.Equality<{ foo: string }, WithVars<{ str: "FOO" }>>
      >().toEqualTypeOf<
        `foo == "${string}"` | "foo == (string)" | "foo == $str"
      >();
      expectTypeOf<
        Expressions.Equality<{ bar: number }, WithVars<{ str: string }>>
      >().toEqualTypeOf<`bar == ${number}` | "bar == (number)">();
      expectTypeOf<
        Expressions.Equality<{ foo: 999 }, WithVars<{ num: number }>>
      >().toEqualTypeOf<`foo == 999` | "foo == $num">();
      expectTypeOf<
        Expressions.Equality<{ foo: number }, WithVars<{ num: number }>>
      >().toEqualTypeOf<
        "foo == $num" | "foo == (number)" | `foo == ${number}`
      >();
    });

    it("nested properties can be compared", () => {
      type WithNested = {
        foo: "FOO";
        bar: {
          baz: "BAZ";
          str: string;
          num: number;
        };
      };
      type Actual = Expressions.Equality<
        WithNested,
        WithVars<{ str: string; num: number }>
      >;
      type Expected =
        | "foo == $str"
        | 'foo == "FOO"'
        | 'bar.baz == "BAZ"'
        | "bar.baz == $str"
        | "bar.str == $str"
        | "bar.str == (string)"
        | `bar.str == "${string}"`
        | "bar.num == $num"
        | "bar.num == (number)"
        | `bar.num == ${number}`;

      // This is really hard to debug:
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
      // Here are 2 easier ways to debug:
      type ActualExtras = Exclude<Expected, Actual>;
      type ActualMissing = Exclude<Actual, Expected>;
      expectTypeOf<ActualExtras>().toEqualTypeOf<never>();
      expectTypeOf<ActualMissing>().toEqualTypeOf<never>();
    });

    type ManyParameters = {
      str1: string;
      str2: string;
      num1: number;
      bool: boolean;
    };

    it("we can extract parameters based on their type", () => {
      type ParameterEntries = Expressions.ParameterEntries<ManyParameters>;
      expectTypeOf<Simplify<ParameterEntries>>().toEqualTypeOf<{
        $str1: string;
        $str2: string;
        $num1: number;
        $bool: boolean;
      }>();

      expectTypeOf<
        Expressions.StringKeysWithType<ParameterEntries, string>
      >().toEqualTypeOf<"$str1" | "$str2">();
      expectTypeOf<
        Expressions.StringKeysWithType<ParameterEntries, "LITERAL">
      >().toEqualTypeOf<"$str1" | "$str2">();
      expectTypeOf<
        Expressions.StringKeysWithType<ParameterEntries, number>
      >().toEqualTypeOf<"$num1">();
      expectTypeOf<
        Expressions.StringKeysWithType<ParameterEntries, boolean>
      >().toEqualTypeOf<"$bool">();
    });

    it("multiple values are compared to same-typed parameters", () => {
      type Res = Expressions.Equality<FooBarBaz, WithVars<ManyParameters>>;
      expectTypeOf<Res>().toEqualTypeOf<
        | "foo == $str1"
        | "foo == $str2"
        | "foo == (string)"
        | `foo == "${string}"`
        | "bar == $num1"
        | "bar == (number)"
        | `bar == ${number}`
        | "baz == $bool"
        | "baz == true"
        | "baz == false"
      >();
    });

    type NestedParameters = {
      nested: {
        str1: string;
        deep: {
          str2: string;
          num1: number;
        };
      };
    };
    it("should work with deeply-nested parameters", () => {
      type Res = Expressions.Equality<FooBarBaz, WithVars<NestedParameters>>;

      type StandardSuggestions =
        | `foo == (string)`
        | `foo == "${string}"`
        | `bar == (number)`
        | `bar == ${number}`
        | "baz == true"
        | "baz == false";
      expectTypeOf<Exclude<Res, StandardSuggestions>>().toEqualTypeOf<
        | "foo == $nested.str1"
        | "foo == $nested.deep.str2"
        | "bar == $nested.deep.num1"
      >();
    });

    it("we can extract parameters based on their type", () => {
      type ParameterEntries = Expressions.ParameterEntries<NestedParameters>;
      expectTypeOf<Simplify<ParameterEntries>>().toEqualTypeOf<{
        $nested: NestedParameters["nested"];
        "$nested.str1": string;
        "$nested.deep": NestedParameters["nested"]["deep"];
        "$nested.deep.str2": string;
        "$nested.deep.num1": number;
      }>();
    });
  });
});
describe("Expressions.Conditional", () => {
  type T = Expressions.Conditional<FooBarBaz, QueryConfig>;
  it("should include a good list of possible expressions, including booleans", () => {
    type Expected =
      | "foo == (string)"
      | `foo == "${string}"`
      | `bar == (number)`
      | `bar == ${number}`
      | `baz == true`
      | `baz == false`
      | `baz`
      | `!baz`;
    expectTypeOf<T>().toEqualTypeOf<Expected>();
  });
});
