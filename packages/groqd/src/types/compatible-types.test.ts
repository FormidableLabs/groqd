import { describe, expectTypeOf, it } from "vitest";
import { CompatibleKeys, TypesAreCompatible } from "./compatible-types";

describe("CompatibleKeys", () => {
  type TestType = {
    str: string;
    strLiteral: "literal";
    strNull: string | null;
    strOpt?: string;
    num: number;
    numNull: number | null;
    numOpt?: number;
    arrStr: Array<string>;
    arrNum: Array<number>;
    arrNull: Array<number> | null;
  };
  it("should work for literals", () => {
    expectTypeOf<CompatibleKeys<TestType, string>>().toEqualTypeOf<
      "str" | "strLiteral"
    >();
    expectTypeOf<CompatibleKeys<TestType, "literal">>().toEqualTypeOf<
      "str" | "strLiteral"
    >();
    expectTypeOf<CompatibleKeys<TestType, "FOO">>().toEqualTypeOf<"str">();
    expectTypeOf<CompatibleKeys<TestType, number>>().toEqualTypeOf<"num">();
  });
  it("should work for nulls", () => {
    expectTypeOf<CompatibleKeys<TestType, null>>().toEqualTypeOf<never>();
    expectTypeOf<CompatibleKeys<TestType, string | null>>().toEqualTypeOf<
      "str" | "strLiteral" | "strNull"
    >();
  });
  it("should work for arrays", () => {
    expectTypeOf<CompatibleKeys<TestType, Array<any>>>().toEqualTypeOf<
      "arrStr" | "arrNum"
    >();
    expectTypeOf<
      CompatibleKeys<TestType, Array<string>>
    >().toEqualTypeOf<"arrStr">();
    expectTypeOf<CompatibleKeys<TestType, Array<any> | null>>().toEqualTypeOf<
      "arrStr" | "arrNum" | "arrNull"
    >();
    expectTypeOf<
      CompatibleKeys<TestType, Array<number> | null>
    >().toEqualTypeOf<"arrNum" | "arrNull">();
  });
});
describe("TypesAreCompatible", () => {
  it("should work for literals", () => {
    expectTypeOf<TypesAreCompatible<string, "str">>().toEqualTypeOf<true>();
    expectTypeOf<TypesAreCompatible<"str", string>>().toEqualTypeOf<true>();

    // Should not be compatible:
    expectTypeOf<TypesAreCompatible<"str", "other">>().toEqualTypeOf<false>();
    expectTypeOf<TypesAreCompatible<"str", number>>().toEqualTypeOf<false>();
    expectTypeOf<TypesAreCompatible<number, "str">>().toEqualTypeOf<false>();
  });
});
