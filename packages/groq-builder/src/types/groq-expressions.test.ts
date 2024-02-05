import { describe, expectTypeOf, it } from "vitest";
import { Expressions } from "./groq-expressions";
import { QueryConfig, RootQueryConfig } from "./schema-types";

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
    >().toEqualTypeOf<`foo == "${string}"`>();
    expectTypeOf<
      Expressions.Equality<{ foo: number }, QueryConfig>
    >().toEqualTypeOf<`foo == ${number}`>();
    expectTypeOf<
      Expressions.Equality<{ foo: boolean }, QueryConfig>
    >().toEqualTypeOf<`foo == ${boolean}`>();
    expectTypeOf<
      Expressions.Equality<{ foo: null }, QueryConfig>
    >().toEqualTypeOf<`foo == ${null}`>();
  });

  it("multiple literals", () => {
    expectTypeOf<
      Expressions.Equality<{ foo: "FOO"; bar: 999 }, QueryConfig>
    >().toEqualTypeOf<'foo == "FOO"' | "bar == 999">();
  });
  it("multiple primitives", () => {
    expectTypeOf<
      Expressions.Equality<{ foo: string; bar: number }, QueryConfig>
    >().toEqualTypeOf<`foo == "${string}"` | `bar == ${number}`>();
  });
  it("mixed types", () => {
    expectTypeOf<
      Expressions.Equality<{ foo: "FOO"; bar: number }, QueryConfig>
    >().toEqualTypeOf<'foo == "FOO"' | `bar == ${number}`>();
  });

  describe("with variables", () => {
    type WithVars<TVars> = RootQueryConfig & { variables: TVars };

    it("a literal value can be compared to variables with the same type", () => {
      expectTypeOf<
        Expressions.Equality<{ foo: "FOO" }, WithVars<{ str: string }>>
      >().toEqualTypeOf<'foo == "FOO"' | "foo == $str">();
      expectTypeOf<
        Expressions.Equality<{ foo: string }, WithVars<{ str: "FOO" }>>
      >().toEqualTypeOf<`foo == "${string}"` | "foo == $str">();
      expectTypeOf<
        Expressions.Equality<{ foo: number }, WithVars<{ str: string }>>
      >().toEqualTypeOf<`foo == ${number}`>();
      expectTypeOf<
        Expressions.Equality<{ foo: 999 }, WithVars<{ num: number }>>
      >().toEqualTypeOf<`foo == 999` | "foo == $num">();
      expectTypeOf<
        Expressions.Equality<{ foo: number }, WithVars<{ num: number }>>
      >().toEqualTypeOf<`foo == ${number}` | "foo == $num">();
    });

    type Variables = {
      str1: string;
      str2: string;
      num: number;
      bool: boolean;
    };

    it("we can extract variables based on their type", () => {
      expectTypeOf<
        Expressions.VariablesOfType<Variables, string>
      >().toEqualTypeOf<"$str1" | "$str2">();
      expectTypeOf<
        Expressions.VariablesOfType<Variables, "LITERAL">
      >().toEqualTypeOf<"$str1" | "$str2">();
      expectTypeOf<
        Expressions.VariablesOfType<Variables, number>
      >().toEqualTypeOf<"$num">();
      expectTypeOf<
        Expressions.VariablesOfType<Variables, boolean>
      >().toEqualTypeOf<"$bool">();
    });

    it("multiple values are compared to same-typed variables", () => {
      type Item = { foo: string; bar: number; baz: boolean };
      type Res = Expressions.Equality<Item, WithVars<Variables>>;
      expectTypeOf<Res>().toEqualTypeOf<
        | `foo == "${string}"`
        | "foo == $str1"
        | "foo == $str2"
        | `bar == ${number}`
        | "bar == $num"
        | `baz == ${boolean}`
        | "baz == $bool"
      >();
    });
  });
});
