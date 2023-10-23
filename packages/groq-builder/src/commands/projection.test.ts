import { describe, it, expect } from "vitest";
import { createGroqBuilder } from "../groq-builder";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { TypeMismatchError } from "../utils/type-utils";

const q = createGroqBuilder<SchemaConfig>();

const variants = q.star.filterByType("variant");

describe("projection (field)", () => {
  it("", () => {
    const res = variants.projection("price");

    expectType<ExtractScope<typeof res>>().toStrictEqual<Array<number>>();
    expect(res).toMatchObject({
      query: "*[_type == 'variant'].price",
    });
  });
  it("", () => {
    const res = variants.projection("name");

    expectType<ExtractScope<typeof res>>().toStrictEqual<Array<string>>();
    expect(res).toMatchObject({
      query: "*[_type == 'variant'].name",
    });
  });
});

describe("projection (objects)", () => {
  it("projection a single property", () => {
    const res = variants.projection({
      name: true,
    });

    expect(res).toMatchObject({
      query: "*[_type == 'variant']{name}",
    });

    expectType<ExtractScope<typeof res>>().toStrictEqual<
      Array<{
        name: string;
      }>
    >();
  });

  it("projection multiple properties", () => {
    const res = variants.projection({
      _id: true,
      name: true,
      price: true,
      msrp: true,
    });

    expect(res).toMatchObject({
      query: "*[_type == 'variant']{_id,name,price,msrp}",
    });

    expectType<ExtractScope<typeof res>>().toStrictEqual<
      Array<{
        _id: string;
        name: string;
        price: number;
        msrp: number;
      }>
    >();
  });

  it("cannot projection props that don't exist", () => {
    const res = variants.projection({
      INVALID: true,
    });

    expectType<ExtractScope<typeof res>>().toBeAssignableTo<
      Array<{
        INVALID: TypeMismatchError<any>;
      }>
    >();
  });
});
