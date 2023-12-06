import { describe, expect, it } from "vitest";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { expectType } from "../tests/expectType";
import { InferResultType } from "../types/public-types";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { createGroqBuilder } from "../index";

const q = createGroqBuilder<SchemaConfig>();
const qVariants = q.star.filterByType("variant");

describe("projectField (naked projections)", () => {
  const qPrices = qVariants.projectField("price");
  const qNames = qVariants.projectField("name");
  const qImages = qVariants.projectField("images[]");
  const data = mock.generateSeedData({
    variants: mock.array(5, (i) =>
      mock.variant({
        name: `Variant ${i}`,
        price: 55 + i,
        msrp: 55 + i,
      })
    ),
  });

  it("can project a number", () => {
    expectType<InferResultType<typeof qPrices>>().toStrictEqual<
      Array<number>
    >();
    expect(qPrices.query).toMatchInlineSnapshot(
      '"*[_type == \\"variant\\"].price"'
    );
  });
  it("can project a string", () => {
    expectType<InferResultType<typeof qNames>>().toStrictEqual<Array<string>>();
    expect(qNames.query).toMatchInlineSnapshot(
      '"*[_type == \\"variant\\"].name"'
    );
  });
  it("can project arrays with []", () => {
    type ResultType = InferResultType<typeof qImages>;

    expectType<ResultType>().toStrictEqual<Array<
      NonNullable<SanitySchema.Variant["images"]>
    > | null>();
  });
  it("can chain projections", () => {
    const qSlugCurrent = qVariants.projectField("slug").projectField("current");
    expectType<InferResultType<typeof qSlugCurrent>>().toStrictEqual<
      Array<string>
    >();

    const qImageNames = qVariants
      .slice(0)
      .projectField("images[]")
      .projectField("name");
    expectType<
      InferResultType<typeof qImageNames>
    >().toStrictEqual<Array<string> | null>();
  });

  it("executes correctly (price)", async () => {
    const results = await executeBuilder(qPrices, data.datalake);
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
    const results = await executeBuilder(qNames, data.datalake);
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

  describe("deep properties", () => {
    it("invalid entries should have TS errors", () => {
      // @ts-expect-error ---
      qVariants.projectField("slug[]");
      // @ts-expect-error ---
      qVariants.projectField("slug.INVALID");
      // @ts-expect-error ---
      qVariants.projectField("INVALID");
      // @ts-expect-error ---
      qVariants.projectField("INVALID.current");
    });

    it("can project nested properties", () => {
      const qSlugs = qVariants.projectField("slug.current");
      expectType<InferResultType<typeof qSlugs>>().toStrictEqual<
        Array<string>
      >();
      expect(qSlugs.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"].slug.current"'
      );
    });

    it("can project arrays with []", () => {
      const qImages = qVariants.projectField("images[]");
      type ResultType = InferResultType<typeof qImages>;

      expectType<ResultType>().toStrictEqual<Array<
        NonNullable<SanitySchema.Variant["images"]>
      > | null>();
    });
  });
});
