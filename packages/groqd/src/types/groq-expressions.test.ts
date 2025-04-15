import { describe, expectTypeOf, it } from "vitest";
import { Expressions } from "./groq-expressions";
import {
  ConfigAddParameters,
  ConfigCreateNestedScope,
  QueryConfig,
} from "./query-config";
import { ParametersWith$Sign } from "./parameter-types";
import { SanitySchema } from "../tests/schemas/nextjs-sanity-fe";

type FooBarBaz = { foo: string; bar: number; baz: boolean };

type WithParameters<TVars> = QueryConfig & {
  scope: ParametersWith$Sign<TVars>;
};

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
    >().toEqualTypeOf<`foo == ${boolean}`>();
    expectTypeOf<
      Expressions.Equality<{ foo: null }, QueryConfig>
    >().toEqualTypeOf<`foo == null`>();
  });
  it("optional values are properly typed", () => {
    expectTypeOf<
      Expressions.Equality<{ foo: undefined }, QueryConfig>
    >().toEqualTypeOf<"foo == null">();
    expectTypeOf<
      Expressions.Equality<{ foo?: 999 }, QueryConfig>
    >().toEqualTypeOf<"foo == null" | "foo == 999" | "foo == (number)">();
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
    it("a literal value can be compared to parameters with the same type", () => {
      expectTypeOf<
        Expressions.Equality<{ foo: "FOO" }, WithParameters<{ str: string }>>
      >().toEqualTypeOf<'foo == "FOO"' | "foo == $str">();
      expectTypeOf<
        Expressions.Equality<{ foo: string }, WithParameters<{ str: "FOO" }>>
      >().toEqualTypeOf<
        `foo == "${string}"` | "foo == (string)" | "foo == $str"
      >();
      expectTypeOf<
        Expressions.Equality<{ bar: number }, WithParameters<{ str: string }>>
      >().toEqualTypeOf<`bar == ${number}` | "bar == (number)">();
      expectTypeOf<
        Expressions.Equality<{ foo: 999 }, WithParameters<{ num: number }>>
      >().toEqualTypeOf<`foo == 999` | "foo == $num">();
      expectTypeOf<
        Expressions.Equality<{ foo: number }, WithParameters<{ num: number }>>
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
        WithParameters<{ str: string; num: number }>
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

    it("we can extract scope parameters based on type", () => {
      type Scope = ParametersWith$Sign<ManyParameters>;

      expectTypeOf<Expressions.KeysByType<Scope, string>>().toEqualTypeOf<
        "$str1" | "$str2"
      >();
      expectTypeOf<Expressions.KeysByType<Scope, "LITERAL">>().toEqualTypeOf<
        "$str1" | "$str2"
      >();
      expectTypeOf<
        Expressions.KeysByType<Scope, number>
      >().toEqualTypeOf<"$num1">();
      expectTypeOf<
        Expressions.KeysByType<Scope, boolean>
      >().toEqualTypeOf<"$bool">();
    });

    it("multiple values are compared to same-typed parameters", () => {
      type Res = Expressions.Equality<
        FooBarBaz,
        WithParameters<ManyParameters>
      >;
      expectTypeOf<Res>().toEqualTypeOf<
        | "foo == $str1"
        | "foo == $str2"
        | "foo == (string)"
        | `foo == "${string}"`
        | "bar == $num1"
        | "bar == (number)"
        | `bar == ${number}`
        | "baz == $bool"
        | `baz == ${boolean}`
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
      type Res = Expressions.Equality<
        FooBarBaz,
        WithParameters<NestedParameters>
      >;

      type StandardSuggestions =
        | "foo == (string)"
        | `foo == "${string}"`
        | `bar == (number)`
        | `bar == ${number}`
        | `baz == ${boolean}`;
      type NestedSuggestions = Exclude<Res, StandardSuggestions>;
      expectTypeOf<NestedSuggestions>().toEqualTypeOf<
        | "foo == $nested.str1"
        | "foo == $nested.deep.str2"
        | "bar == $nested.deep.num1"
      >();
    });
  });
});
describe("Expressions.Conditional", () => {
  type Result = Expressions.Conditional<FooBarBaz, QueryConfig>;
  it("should include a good list of possible expressions, including booleans", () => {
    type Expected =
      | "foo == (string)"
      | `foo == "${string}"`
      | `bar == (number)`
      | `bar == ${number}`
      | `baz == ${boolean}`
      | `baz`
      | `!baz`;
    expectTypeOf<Result>().toEqualTypeOf<Expected>();
  });

  it("unions should work just fine", () => {
    type TUnion =
      | { _type: "TypeA"; a: "A" }
      //
      | { _type: "TypeB"; b: "B" };
    type Result = Expressions.Conditional<TUnion, QueryConfig>;
    expectTypeOf<Result>().toEqualTypeOf<
      | '_type == "TypeA"'
      //
      | '_type == "TypeB"'
    >();
  });

  describe("when there are fields in scope", () => {
    type Parent = {
      _id: string;
      _type: "parent";
      str: string;
      num: number;
      bool: boolean;
    };
    type Child = {
      _id: string;
      _type: "child";
      str: string;
      num: number;
      bool: boolean;
    };
    type DoubleNestedConfig = ConfigCreateNestedScope<
      ConfigCreateNestedScope<QueryConfig, Parent>,
      Child
    >;
    type QueryConfigWithScope = ConfigAddParameters<
      DoubleNestedConfig,
      { param: "PARAM_VALUE" }
    >;

    type StandardSuggestions = Expressions.Conditional<FooBarBaz, QueryConfig>;
    type ScopeSuggestions = Expressions.Conditional<
      FooBarBaz,
      QueryConfigWithScope
    >;

    it("should suggest items from the scope", () => {
      type NewSuggestions = Exclude<ScopeSuggestions, StandardSuggestions>;
      expectTypeOf<NewSuggestions>().toEqualTypeOf<
        | "foo == $param"
        | "foo == ^._id"
        | "foo == ^._type"
        | "foo == ^.str"
        | "bar == ^.num"
        | "baz == ^.bool"
        | "references(^._id)"
        | "references(^.str)"
        | "references($param)"
      >();
    });
  });

  describe("when there are actual objects in scope", () => {
    type Depth0 = ConfigAddParameters<QueryConfig, { param: 999 }>;
    type Depth1 = ConfigCreateNestedScope<Depth0, SanitySchema.Category>;
    type Depth2 = ConfigCreateNestedScope<Depth1, SanitySchema.Variant>;
    type Depth3 = ConfigCreateNestedScope<Depth2, SanitySchema.Flavour>;

    type Expression0 = Expressions.Conditional<FooBarBaz, Depth0>;
    type Expression1 = Expressions.Conditional<FooBarBaz, Depth1>;
    type Expression2 = Expressions.Conditional<FooBarBaz, Depth2>;
    type Expression3 = Expressions.Conditional<FooBarBaz, Depth3>;

    type ExpectedFooBarBaz =
      | "foo == (string)"
      | `foo == "${string}"`
      | "bar == (number)"
      | `bar == ${number}`
      | "baz"
      | "!baz"
      | `baz == ${boolean}`;

    it("should suggest items from Depth 0 and Depth 1", () => {
      type Expected = "bar == $param";

      expectTypeOf<
        Exclude<Expression0, ExpectedFooBarBaz>
      >().toEqualTypeOf<Expected>();
      expectTypeOf<
        Exclude<Expression1, ExpectedFooBarBaz>
      >().toEqualTypeOf<Expected>();
    });
    it("should suggest items from Depth 2", () => {
      type Expected =
        | "bar == $param"
        | "foo == ^._id"
        | "foo == ^._createdAt"
        | "foo == ^._updatedAt"
        | "foo == ^._rev"
        | "foo == ^._type"
        | "foo == ^.name"
        | "foo == ^.slug.current"
        | "references(^._id)"
        | "references(^.name)"
        | "references(^.slug.current)";
      type Actual = Exclude<Expression2, ExpectedFooBarBaz>;
      expectTypeOf<Exclude<Actual, Expected>>().toEqualTypeOf<never>();
      expectTypeOf<Exclude<Expected, Actual>>().toEqualTypeOf<never>();
    });
    it("should suggest items from Depth 3", () => {
      type Expected =
        | "foo == ^._createdAt"
        | "foo == ^._id"
        | "foo == ^._rev"
        | "foo == ^._type"
        | "foo == ^._updatedAt"
        | "foo == ^.name"
        | "foo == ^.slug.current"
        | "bar == $param"
        | "bar == ^.msrp"
        | "bar == ^.price"
        | "references(^._id)"
        | "references(^.name)"
        | "references(^.slug.current)"
        // Double-parent:
        | "foo == ^.^._createdAt"
        | "foo == ^.^._id"
        | "foo == ^.^._rev"
        | "foo == ^.^._type"
        | "foo == ^.^._updatedAt"
        | "foo == ^.^.name"
        | "foo == ^.^.slug.current"
        | "references(^.^._id)"
        | "references(^.^.name)"
        | "references(^.^.slug.current)";

      type Actual = Exclude<Expression3, ExpectedFooBarBaz>;
      expectTypeOf<Exclude<Actual, Expected>>().toEqualTypeOf<never>();
      expectTypeOf<Exclude<Expected, Actual>>().toEqualTypeOf<never>();
    });
  });
});
describe("Expressions.Score", () => {
  type StandardConditionals = Expressions.Conditional<FooBarBaz, QueryConfig>;
  type ScoreSuggestions = Expressions.Score<FooBarBaz, QueryConfig>;
  it('should include "match" with suggestions', () => {
    type ExpectedSuggestions =
      // Only string-fields (e.g. "foo") should be suggested with "match"
      `foo match "${string}"` | "foo match (string)";

    type ActualSuggestions = Exclude<ScoreSuggestions, StandardConditionals>;
    expectTypeOf<ActualSuggestions>().toEqualTypeOf<ExpectedSuggestions>();
    type Missing = Exclude<ExpectedSuggestions, ActualSuggestions>;
    expectTypeOf<Missing>().toEqualTypeOf<never>();
    type Extra = Exclude<ActualSuggestions, ExpectedSuggestions>;
    expectTypeOf<Extra>().toEqualTypeOf<never>();
  });
});
describe("Expressions.Order", () => {
  type SortableType = {
    str: string;
    strNull?: string;
    num: number;
    numNull?: number;
    bool: boolean;
    nested: {
      str: string;
    };
    // Should be ignored:
    reference: {
      _type: "reference";
      _ref: string;
      _weak?: boolean;
    };
    slug: {
      _type: "slug";
      current: string;
      source?: string;
    };
  };
  type ExpectedFields =
    | "str"
    | "strNull"
    | "nested.str"
    | "slug.current"
    | "num"
    | "numNull"
    | "bool";
  type Expected =
    | `${ExpectedFields}`
    | `${ExpectedFields} asc`
    | `${ExpectedFields} desc`;

  it("should generate a good list of suggestions", () => {
    expectTypeOf<Expressions.Order<SortableType>>().toEqualTypeOf<Expected>();
  });
});
describe("Expressions.Countable", () => {
  it("should generate a good list of suggestions", () => {
    type ActualSuggestions =
      keyof Expressions.CountableEntries<SanitySchema.Variant>;
    type Expected =
      | "description[]"
      ///
      | "images[]"
      | "flavour[]"
      | "style[]";
    type Missing = Exclude<ActualSuggestions, Expected>;
    expectTypeOf<Missing>().toEqualTypeOf<never>();
    expectTypeOf<ActualSuggestions>().toEqualTypeOf<Expected>();
  });
});
