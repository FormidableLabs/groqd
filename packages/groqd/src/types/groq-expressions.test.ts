import { describe, expectTypeOf, it } from "vitest";
import { SanitySchema } from "../tests/schemas/nextjs-sanity-fe";
import { Expressions } from "./groq-expressions";
import { ParametersWith$Sign } from "./parameter-types";
import { ProjectionPathEntries } from "./projection-paths";
import {
  ConfigAddParameters,
  ConfigCreateNestedScope,
  QueryConfig,
} from "./query-config";

type FooBarBaz = {
  foo: string;
  bar?: number;
  baz: boolean;
};

type WithParameters<TVars> = QueryConfig & {
  scope: ParametersWith$Sign<TVars>;
};
describe("Expressions.Conditional (simple)", () => {
  type eq = "==" | "!=";
  type gte = ">=" | ">" | "<" | "<=" | eq;
  it("literal values are properly escaped", () => {
    expectTypeOf<
      Expressions.Conditional<{ foo: "FOO" }, QueryConfig>
    >().toEqualTypeOf<'foo == "FOO"' | 'foo != "FOO"'>();
    expectTypeOf<
      Expressions.Conditional<{ foo: 999 }, QueryConfig>
    >().toEqualTypeOf<
      | "foo == 999"
      | "foo != 999"
      | "foo >= 999"
      | "foo > 999"
      | "foo < 999"
      | "foo <= 999"
    >();
    expectTypeOf<
      Expressions.Conditional<{ foo: true }, QueryConfig>
    >().toEqualTypeOf<"foo" | "!foo">();
    expectTypeOf<
      Expressions.Conditional<{ foo: null }, QueryConfig>
    >().toEqualTypeOf<"foo == null" | "foo != null">();
  });
  it("primitive values are properly typed", () => {
    expectTypeOf<
      Expressions.Conditional<{ foo: string }, QueryConfig>
    >().toEqualTypeOf<`foo ${eq} "${string}"` | `foo ${eq} (string)`>();
    expectTypeOf<
      Expressions.Conditional<{ foo: number }, QueryConfig>
    >().toEqualTypeOf<`foo ${gte} ${number}` | `foo ${gte} (number)`>();
    expectTypeOf<
      Expressions.Conditional<{ foo: boolean }, QueryConfig>
    >().toEqualTypeOf<"foo" | "!foo">();
    expectTypeOf<
      Expressions.Conditional<{ foo: null }, QueryConfig>
    >().toEqualTypeOf<`foo ${eq} null`>();
  });
  it("optional values are properly typed", () => {
    expectTypeOf<
      Expressions.Conditional<{ foo: undefined }, QueryConfig>
    >().toEqualTypeOf<`foo ${eq} null`>();
    expectTypeOf<
      Expressions.Conditional<{ foo?: 999 }, QueryConfig>
    >().toEqualTypeOf<
      `foo ${eq} null` | `foo ${eq} 999` | `foo ${eq} (number)`
    >();
  });

  it("multiple literals", () => {
    expectTypeOf<
      Expressions.Conditional<{ foo: "FOO"; bar: 999 }, QueryConfig>
    >().toEqualTypeOf<`foo ${eq} "FOO"` | `bar ${gte} 999`>();
  });
  it("multiple primitives", () => {
    expectTypeOf<
      Expressions.Conditional<{ foo: string; bar: number }, QueryConfig>
    >().toEqualTypeOf<
      | `foo ${eq} (string)`
      | `foo ${eq} "${string}"`
      | `bar ${gte} (number)`
      | `bar ${gte} ${number}`
    >();
  });
  it("mixed types", () => {
    expectTypeOf<
      Expressions.Conditional<{ foo: "FOO"; bar: number }, QueryConfig>
    >().toEqualTypeOf<
      `foo ${eq} "FOO"` | `bar ${gte} (number)` | `bar ${gte} ${number}`
    >();
  });

  describe("with parameters", () => {
    it("a literal value can be compared to parameters with the same type", () => {
      expectTypeOf<
        Expressions.Conditional<{ foo: "FOO" }, WithParameters<{ str: string }>>
      >().toEqualTypeOf<
        `foo ${eq} "FOO"` | `foo ${eq} $str` | "references($str)"
      >();
      expectTypeOf<
        Expressions.Conditional<{ foo: string }, WithParameters<{ str: "FOO" }>>
      >().toEqualTypeOf<
        | `foo ${eq} "${string}"`
        | `foo ${eq} (string)`
        | `foo ${eq} $str`
        | "references($str)"
      >();
      expectTypeOf<
        Expressions.Conditional<
          { bar: number },
          WithParameters<{ str: string }>
        >
      >().toEqualTypeOf<
        `bar ${gte} ${number}` | `bar ${gte} (number)` | "references($str)"
      >();
      expectTypeOf<
        Expressions.Conditional<{ foo: 999 }, WithParameters<{ num: number }>>
      >().toEqualTypeOf<`foo ${gte} 999` | `foo ${gte} $num`>();
      expectTypeOf<
        Expressions.Conditional<
          { foo: number },
          WithParameters<{ num: number }>
        >
      >().toEqualTypeOf<
        `foo ${gte} $num` | `foo ${gte} (number)` | `foo ${gte} ${number}`
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
      type Actual = Expressions.Conditional<
        ProjectionPathEntries<WithNested>,
        WithParameters<{ str: string; num: number }>
      >;
      type Expected =
        | `foo ${eq} $str`
        | `foo ${eq} "FOO"`
        | `bar.baz ${eq} "BAZ"`
        | `bar.baz ${eq} $str`
        | `bar.str ${eq} $str`
        | `bar.str ${eq} (string)`
        | `bar.str ${eq} "${string}"`
        | `bar.num ${gte} $num`
        | `bar.num ${gte} (number)`
        | `bar.num ${gte} ${number}`
        | "references($str)";

      expectTypeOf<Exclude<Expected, Actual>>().toEqualTypeOf<never>();
      expectTypeOf<Exclude<Actual, Expected>>().toEqualTypeOf<never>();
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
      type Res = Expressions.Conditional<
        FooBarBaz,
        WithParameters<ManyParameters>
      >;
      type Expected =
        | `foo ${eq} $str1`
        | `foo ${eq} $str2`
        | `foo ${eq} (string)`
        | `foo ${eq} "${string}"`
        | `bar ${eq} $num1`
        | `bar ${eq} (number)`
        | `bar ${eq} ${number}`
        | `bar ${eq} null`
        | `baz ${eq} $bool`
        | "baz"
        | "!baz"
        | "references($str1)"
        | "references($str2)";

      expectTypeOf<Exclude<Res, Expected>>().toEqualTypeOf<never>();
      expectTypeOf<Exclude<Expected, Res>>().toEqualTypeOf<never>();
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
      type Res = Expressions.Conditional<
        FooBarBaz,
        WithParameters<NestedParameters>
      >;

      type StandardSuggestions =
        | `foo ${eq} (string)`
        | `foo ${eq} "${string}"`
        | `bar ${eq} (number)`
        | `bar ${eq} ${number}`
        | `bar ${eq} null`
        | `baz ${eq} ${boolean}`;
      type NestedSuggestions = Exclude<Res, StandardSuggestions>;
      type Expected =
        | `foo ${eq} $nested.str1`
        | `foo ${eq} $nested.deep.str2`
        | `bar ${eq} $nested.deep.num1`
        | "baz"
        | "!baz"
        | "references($nested.str1)"
        | "references($nested.deep.str2)";

      expectTypeOf<
        Exclude<Expected, NestedSuggestions>
      >().toEqualTypeOf<never>();
      expectTypeOf<
        Exclude<NestedSuggestions, Expected>
      >().toEqualTypeOf<never>();
    });
  });
});
describe("Expressions.Field", () => {
  type Result = Expressions.Field<FooBarBaz, QueryConfig>;
  type ResultValue = Expressions.FieldValue<FooBarBaz, QueryConfig, Result>;
  it("should include a good list of possible expressions, including booleans", () => {
    type Expected = "foo" | "bar" | "baz";
    expectTypeOf<Exclude<Result, Expected>>().toEqualTypeOf<never>();
    expectTypeOf<Exclude<Expected, Result>>().toEqualTypeOf<never>();
    expectTypeOf<ResultValue>().toEqualTypeOf<
      string | number | boolean | null
    >();
  });

  it("unions should work just fine", () => {
    type TUnion =
      | { _type: "TypeA"; a: "A" }
      //
      | { _type: "TypeB"; b: "B" };
    type Result = Expressions.Field<TUnion, QueryConfig>;
    type ResultValue = Expressions.FieldValue<TUnion, QueryConfig, Result>;
    type Expected = "_type";
    expectTypeOf<Exclude<Result, Expected>>().toEqualTypeOf<never>();
    expectTypeOf<Exclude<Expected, Result>>().toEqualTypeOf<never>();
    expectTypeOf<ResultValue>().toEqualTypeOf<"TypeA" | "TypeB">();
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

    type ScopeSuggestions = Expressions.Field<FooBarBaz, QueryConfigWithScope>;

    it("should suggest items from the scope", () => {
      type Expected =
        | "foo"
        | "bar"
        | "baz"
        | "@"
        | "^"
        | "$param"
        | "^._type"
        | "^._id"
        | "^.str"
        | "^.bool"
        | "^.num";

      expectTypeOf<
        Exclude<ScopeSuggestions, Expected>
      >().toEqualTypeOf<never>();
      expectTypeOf<
        Exclude<Expected, ScopeSuggestions>
      >().toEqualTypeOf<never>();
    });
    it("should have correct value types", () => {
      type GetFieldValue<TField extends ScopeSuggestions> =
        Expressions.FieldValue<FooBarBaz, QueryConfigWithScope, TField>;

      expectTypeOf<GetFieldValue<"foo">>().toEqualTypeOf<string>();
      expectTypeOf<GetFieldValue<"bar">>().toEqualTypeOf<number | null>();
      expectTypeOf<GetFieldValue<"baz">>().toEqualTypeOf<boolean>();
      expectTypeOf<GetFieldValue<"@">>().toEqualTypeOf<Child>();
      expectTypeOf<GetFieldValue<"^">>().toMatchTypeOf<Parent>();
      expectTypeOf<GetFieldValue<"$param">>().toEqualTypeOf<"PARAM_VALUE">();
      expectTypeOf<GetFieldValue<"^._type">>().toEqualTypeOf<"parent">();
      expectTypeOf<GetFieldValue<"^._id">>().toEqualTypeOf<string>();
      expectTypeOf<GetFieldValue<"^.str">>().toEqualTypeOf<string>();
      expectTypeOf<GetFieldValue<"^.bool">>().toEqualTypeOf<boolean>();
      expectTypeOf<GetFieldValue<"^.num">>().toEqualTypeOf<number>();
    });
  });
});
describe("Expressions.Conditional", () => {
  type eq = "==" | "!=";

  type Result = Expressions.Conditional<FooBarBaz, QueryConfig>;
  it("should include a good list of possible expressions, including booleans", () => {
    type Expected =
      // Equality:
      | `foo == (string)`
      | `foo == "${string}"`
      | `bar == (number)`
      | `bar == ${number}`
      | `bar == null`
      // Inequality:
      | `foo != (string)`
      | `foo != "${string}"`
      | `bar != (number)`
      | `bar != ${number}`
      | `bar != null`
      // Boolean:
      | `baz`
      | `!baz`;
    expectTypeOf<Exclude<Result, Expected>>().toEqualTypeOf<never>();
    expectTypeOf<Exclude<Expected, Result>>().toEqualTypeOf<never>();
  });

  it("unions should work just fine", () => {
    type TUnion =
      | { _type: "TypeA"; a: "A" }
      //
      | { _type: "TypeB"; b: "B" };
    type Result = Expressions.Conditional<TUnion, QueryConfig>;
    expectTypeOf<Result>().toEqualTypeOf<
      | '_type == "TypeA"'
      | '_type == "TypeB"'
      | '_type != "TypeA"'
      | '_type != "TypeB"'
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
      type Expected =
        | `foo ${eq} $param`
        | `foo ${eq} ^._id`
        | `foo ${eq} ^._type`
        | `foo ${eq} ^.str`
        | `bar ${eq} ^.num`
        | `baz ${eq} ^.bool`
        | "references(^._id)"
        | "references(^.str)"
        | "references($param)";

      expectTypeOf<Exclude<NewSuggestions, Expected>>().toEqualTypeOf<never>();
      expectTypeOf<Exclude<Expected, NewSuggestions>>().toEqualTypeOf<never>();
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
      | `foo ${eq} (string)`
      | `foo ${eq} "${string}"`
      | `bar ${eq} (number)`
      | `bar ${eq} ${number}`
      | `bar ${eq} null`
      | "baz"
      | "!baz";

    it("should suggest items from Depth 0 and Depth 1", () => {
      type Expected = "bar == $param" | "bar != $param";

      type Actual0 = Exclude<Expression0, ExpectedFooBarBaz>;
      expectTypeOf<Exclude<Actual0, Expected>>().toEqualTypeOf<never>();
      expectTypeOf<Exclude<Expected, Actual0>>().toEqualTypeOf<never>();

      type Actual1 = Exclude<Expression1, ExpectedFooBarBaz>;
      expectTypeOf<Exclude<Actual1, Expected>>().toEqualTypeOf<never>();
      expectTypeOf<Exclude<Expected, Actual1>>().toEqualTypeOf<never>();
    });
    it("should suggest items from Depth 2", () => {
      type Expected =
        | `foo ${eq} ^._id`
        | `foo ${eq} ^._createdAt`
        | `foo ${eq} ^._updatedAt`
        | `foo ${eq} ^._rev`
        | `foo ${eq} ^._type`
        | `foo ${eq} ^.name`
        | `foo ${eq} ^.description`
        | `foo ${eq} ^.slug.current`
        | `bar ${eq} $param`
        | "references(^._id)"
        | "references(^.name)"
        | "references(^.slug.current)";
      type Actual = Exclude<Expression2, ExpectedFooBarBaz>;
      expectTypeOf<Exclude<Actual, Expected>>().toEqualTypeOf<never>();
      expectTypeOf<Exclude<Expected, Actual>>().toEqualTypeOf<never>();
    });
    it("should suggest items from Depth 3", () => {
      type Expected =
        | `foo ${eq} ^._createdAt`
        | `foo ${eq} ^._id`
        | `foo ${eq} ^._rev`
        | `foo ${eq} ^._type`
        | `foo ${eq} ^._updatedAt`
        | `foo ${eq} ^.id`
        | `foo ${eq} ^.name`
        | `foo ${eq} ^.slug.current`
        | `bar ${eq} $param`
        | `bar ${eq} ^.msrp`
        | `bar ${eq} ^.price`
        | "references(^._id)"
        | "references(^.name)"
        | "references(^.slug.current)"
        // Double-parent:
        | `foo ${eq} ^.^._createdAt`
        | `foo ${eq} ^.^._id`
        | `foo ${eq} ^.^._rev`
        | `foo ${eq} ^.^._type`
        | `foo ${eq} ^.^._updatedAt`
        | `foo ${eq} ^.^.description`
        | `foo ${eq} ^.^.name`
        | `foo ${eq} ^.^.slug.current`
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
    type Actual = Exclude<ScoreSuggestions, StandardConditionals>;
    type Expected =
      // Only string-fields (e.g. "foo") should be suggested with "match"
      `foo match "${string}"` | "foo match (string)";

    expectTypeOf<Exclude<Expected, Actual>>().toEqualTypeOf<never>();
    expectTypeOf<Exclude<Actual, Expected>>().toEqualTypeOf<never>();
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
