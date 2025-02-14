import { describe, it, expect, expectTypeOf } from "vitest";
import { SanitySchema, q } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../types/public-types";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

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
  it("doesn't really work with fields (naked projections), since it makes the whole array nullable", () => {
    const qNullableField = qVariants.field("name").nullable();
    expectTypeOf<
      InferResultType<typeof qNullableField>
    >().toEqualTypeOf<Array<string> | null>();
  });
  it("to mark a field (naked projection) nullable, it's better to use zod", () => {
    const qNullableFieldFixed = qVariants.field("name", q.string().nullable());
    expectTypeOf<InferResultType<typeof qNullableFieldFixed>>().toEqualTypeOf<
      Array<string | null>
    >();
  });

  const qWithoutValidation = qVariants.project((qV) => ({
    name: qV.field("name").nullable(),
  }));
  it("should execute correctly, without runtime validation", async () => {
    const results = await executeBuilder(qWithoutValidation, data);
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
      const results = await executeBuilder(qWithValidation, data);
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

  describe("when it's redundant", () => {
    it("should give a typescript error", () => {
      q.star.filterByType("flavour").project((sub) => ({
        name: sub
          .field("name")
          // You must pass `true` to acknowledge the redundancy:
          .nullable(true),
        name2: sub
          .field("name")
          // @ts-expect-error --- otherwise it will error:
          .nullable(),
      }));
    });
  });
});
