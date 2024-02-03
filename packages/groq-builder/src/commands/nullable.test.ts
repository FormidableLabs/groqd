import { describe, it, expect, expectTypeOf } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../types/public-types";
import { createGroqBuilderWithZod } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilderWithZod<SchemaConfig>();
const qVariants = q.star.filterByType("variant");

describe("nullable", () => {
  const data = mock.generateSeedData({
    variants: [
      mock.variant({
        // @ts-expect-error ---
        name: null,
      }),
      mock.variant({}),
    ],
  });

  const qVariantsNullable = qVariants.nullable();

  it("should mark a valid query as nullable", () => {
    expectTypeOf<InferResultType<typeof qVariants>>().toEqualTypeOf<
      Array<SanitySchema.Variant>
    >();
    expectTypeOf<
      InferResultType<typeof qVariantsNullable>
    >().toEqualTypeOf<Array<SanitySchema.Variant> | null>();
  });
  it("should do nothing to an already-nullable query", () => {
    const qVariantId = qVariants.field("id");
    type ExpectedType = Array<string> | null; // TODO: shouldn't this be Array<string | null>?
    expectTypeOf<
      InferResultType<typeof qVariantId>
    >().toEqualTypeOf<ExpectedType>();
    const qExtraNullable = qVariantId.nullable();
    expectTypeOf<
      InferResultType<typeof qExtraNullable>
    >().toEqualTypeOf<ExpectedType>();
  });

  const qWithoutValidation = qVariants.project((qV) => ({
    name: qV.field("name").nullable(),
  }));
  it("should execute correctly, without runtime validation", async () => {
    const results = await executeBuilder(qWithoutValidation, data.datalake);
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "name": null,
        },
        {
          "name": "Variant Name",
        },
      ]
    `);
  });

  describe("in a nested projection", () => {
    const qNested = qVariants.project((qV) => ({
      name: qV.field("name"),
      nameMaybe: qV.field("name").nullable(),
    }));
    it("should have the correct type", () => {
      expectTypeOf<InferResultType<typeof qNested>>().toEqualTypeOf<
        Array<{
          name: string;
          nameMaybe: string | null;
        }>
      >();
    });
  });

  describe("runtime validation", () => {
    it("should do nothing if we're not using runtime validation", () => {
      expect(qVariantsNullable.parser).toBeNull();
    });

    const qWithValidation = q.star.filterByType("variant").project((qV) => ({
      name: qV.field("name", q.string()).nullable(),
    }));

    it("should have the correct type", () => {
      expectTypeOf<InferResultType<typeof qWithValidation>>().toEqualTypeOf<
        Array<{
          name: string | null;
        }>
      >();
    });
    it("should have a parser", () => {
      expect(qWithValidation.parser).toBeTypeOf("function");
    });
    it("should execute correctly", async () => {
      const results = await executeBuilder(qWithValidation, data.datalake);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "name": null,
          },
          {
            "name": "Variant Name",
          },
        ]
      `);
    });
  });
});
