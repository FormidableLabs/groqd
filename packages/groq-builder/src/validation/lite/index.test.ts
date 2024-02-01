import { describe, it, expect, expectTypeOf } from "vitest";
import { InferResultItem, InferResultType } from "../../types/public-types";
import { createGroqBuilder } from "../../index";
import { TypeMismatchError } from "../../types/utils";
import {
  SanitySchema,
  SchemaConfig,
} from "../../tests/schemas/nextjs-sanity-fe";

import { validation } from "./index";

describe("createGroqBuilder<any>() (schema-less)", () => {
  const q = createGroqBuilder<any>();

  it("filterByType", () => {
    const qFilterByType = q.star.filterByType("ANYTHING");
    expectTypeOf<
      InferResultType<typeof qFilterByType>
    >().toEqualTypeOf<Array<any> | null>();
  });
  it("deref", () => {
    const qDeref = q.star.deref();
    expectTypeOf<
      InferResultType<typeof qDeref>
    >().toEqualTypeOf<Array<any> | null>();
  });
  it("grab", () => {
    // todo
  });
  it("order", () => {
    const qOrder = q.star.order("ANYTHING");
    expectTypeOf<InferResultType<typeof qOrder>>().toEqualTypeOf<Array<any>>();
  });
  it("slice(0)", () => {
    const qSlice = q.star.slice(0);
    expectTypeOf<InferResultType<typeof qSlice>>().toEqualTypeOf<any>();
    expectTypeOf<InferResultType<typeof qSlice>>().not.toEqualTypeOf<
      Array<any>
    >();
  });
  it("slice(10, 5)", () => {
    const qSlice = q.star.slice(10, 15);
    expectTypeOf<InferResultType<typeof qSlice>>().toEqualTypeOf<Array<any>>();
  });
  it("star", () => {
    const qStar = q.star;
    expectTypeOf<InferResultType<typeof qStar>>().toEqualTypeOf<Array<any>>();
  });
});

describe("createGroqBuilder().include(validation)", () => {
  const q = createGroqBuilder<any>().include(validation);

  it("should contain all methods", () => {
    expect(q.string()).toBeTypeOf("function");
    expect(q.number()).toBeTypeOf("function");
    expect(q.boolean()).toBeTypeOf("function");
    expect(q.bigint()).toBeTypeOf("function");
    expect(q.undefined()).toBeTypeOf("function");
    expect(q.date()).toBeTypeOf("function");
    expect(q.literal("LITERAL")).toBeTypeOf("function");
    expect(q.object()).toBeTypeOf("function");
    expect(q.array()).toBeTypeOf("function");
    expect(q.contentBlock()).toBeTypeOf("function");
    expect(q.contentBlocks()).toBeTypeOf("function");
  });

  it('"q.string()" should work', () => {
    const str = q.string();
    expect(str).toBeTypeOf("function");
    expect(str("FOO")).toEqual("FOO");
    // @ts-expect-error ---
    expect(() => str(111)).toThrowErrorMatchingInlineSnapshot(
      '"Expected string, received 111"'
    );
  });

  it("validation should work with projections", () => {
    const qVariants = q.star.filterByType("variant").project({
      name: q.string(),
      price: q.number(),
    });

    expectTypeOf<InferResultType<typeof qVariants>>().toEqualTypeOf<Array<{
      name: string;
      price: number;
    }> | null>();
  });
});

describe("strongly-typed schema, with runtime validation", () => {
  const q = createGroqBuilder<SchemaConfig>().include(validation);

  it("validation should work with projections", () => {
    const qVariants = q.star.filterByType("variant").project({
      name: q.string(),
      price: q.number(),
    });

    expectTypeOf<InferResultType<typeof qVariants>>().toEqualTypeOf<
      Array<{
        name: string;
        price: number;
      }>
    >();
  });

  it("improper validation usage should be caught at compile time", () => {
    q.star.filterByType("variant").project({
      // @ts-expect-error --- number is not assignable to string
      price: q.string(),
      // @ts-expect-error --- string is not assignable to number
      name: q.number(),
    });

    // @ts-expect-error ---
    const qUnknownFieldName = q.star.filterByType("variant").project({
      INVALID: q.string(),
    });

    type ResultItem = InferResultItem<typeof qUnknownFieldName>;

    expectTypeOf<ResultItem["INVALID"]>().not.toEqualTypeOf<string>();
    expectTypeOf<ResultItem["INVALID"]>().toEqualTypeOf<
      TypeMismatchError<{
        error: "⛔️ Parser can only be used with known properties ⛔️";
        expected: keyof SanitySchema.Variant;
        actual: "INVALID";
      }>
    >();
  });
});
