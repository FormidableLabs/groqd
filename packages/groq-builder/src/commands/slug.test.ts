import { describe, it, expect, expectTypeOf } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../types/public-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>();
const qVariants = q.star.filterByType("variant");

describe("slug", () => {
  const qVariantSlugs = qVariants.project((qVar) => ({
    SLUG: qVar.slug("slug"),
  }));

  it("should have the correct type", () => {
    expectTypeOf<InferResultType<typeof qVariantSlugs>>().toEqualTypeOf<
      Array<{ SLUG: string }>
    >();
  });

  it("should not allow invalid fields to be slugged", () => {
    qVariants.project((qVar) => ({
      // @ts-expect-error ---
      name: qVar.slug("name"),
      // @ts-expect-error ---
      INVALID: qVar.slug("INVALID"),
    }));
  });

  describe("execution", () => {
    const data = mock.generateSeedData({
      variants: [
        mock.variant({ slug: mock.slug({ current: "SLUG_1" }) }),
        mock.variant({ slug: mock.slug({ current: "SLUG_2" }) }),
        mock.variant({ slug: mock.slug({ current: "SLUG_3" }) }),
      ],
    });
    it("should retrieve all slugs", async () => {
      const result = await executeBuilder(qVariantSlugs, data.datalake);

      expect(result).toEqual([
        { SLUG: "SLUG_1" },
        { SLUG: "SLUG_2" },
        { SLUG: "SLUG_3" },
      ]);
    });
    it("should have errors for missing / invalid slugs", async () => {
      const data = mock.generateSeedData({
        variants: [
          // @ts-expect-error ---
          mock.variant({ slug: mock.slug({ current: 123 }) }),
          // @ts-expect-error ---
          mock.variant({ slug: mock.slug({ current: undefined }) }),
          mock.variant({ slug: undefined }),
          mock.variant({}),
        ],
      });

      await expect(() => executeBuilder(qVariantSlugs, data.datalake)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        "3 Parsing Errors:
        result[0].SLUG: Expected a string for 'slug.current' but got 123
        result[1].SLUG: Expected a string for 'slug.current' but got null
        result[2].SLUG: Expected a string for 'slug.current' but got null"
      `);
    });
  });
});
