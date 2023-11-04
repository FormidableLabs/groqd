import { describe, it, expect } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { TypeMismatchError } from "../utils/type-utils";
import { createGroqBuilder } from "../index";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";

const q = createGroqBuilder<SchemaConfig>();

const qVariants = q.star.filterByType("variant");

describe("projection (field)", () => {
  const qPrices = qVariants.projection("price");
  const qNames = qVariants.projection("name");
  const data = mock.generateSeedData({
    variants: mock.array(5, (i) =>
      mock.variant({
        name: `Variant ${i}`,
        price: 55 + i,
      })
    ),
  });

  it("can project a number", () => {
    expectType<ExtractScope<typeof qPrices>>().toStrictEqual<Array<number>>();
    expect(qPrices.query).toMatchInlineSnapshot(
      '"*[_type == \\"variant\\"].price"'
    );
  });
  it("can project a string", () => {
    expectType<ExtractScope<typeof qNames>>().toStrictEqual<Array<string>>();
    expect(qNames.query).toMatchInlineSnapshot(
      '"*[_type == \\"variant\\"].name"'
    );
  });

  it("executes correctly (price)", async () => {
    const results = await executeBuilder(data.datalake, qPrices);
    expect(results).toMatchInlineSnapshot(`
      [
        55,
        56,
        57,
        58,
        59,
      ]
    `);
  });
  it("executes correctly (name)", async () => {
    const results = await executeBuilder(data.datalake, qNames);
    expect(results).toMatchInlineSnapshot(`
      [
        "Variant 0",
        "Variant 1",
        "Variant 2",
        "Variant 3",
        "Variant 4",
      ]
    `);
  });
});

describe.skip("projection (objects)", () => {
  it("projection a single property", () => {
    const res = qVariants.projection({
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
    const res = qVariants.projection({
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
    const res = qVariants.projection({
      INVALID: true,
    });

    expectType<ExtractScope<typeof res>>().toBeAssignableTo<
      Array<{
        INVALID: TypeMismatchError<any>;
      }>
    >();
  });
});
