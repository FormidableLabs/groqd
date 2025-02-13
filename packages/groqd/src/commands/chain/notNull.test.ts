import { describe, it, expectTypeOf, expect } from "vitest";
import { q } from "../../tests/schemas/nextjs-sanity-fe";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";
import { InferResultItem } from "../../types/public-types";
import { executeBuilder } from "../../tests/mocks/executeQuery";

describe("notNull", () => {
  const category = mock.category({});
  const data = mock.generateSeedData({
    products: [
      mock.product({ categories: [mock.reference(category)] }),
      mock.product({ categories: [mock.reference(category)] }),
    ],
    categories: [category],
  });
  const dataWithNulls = mock.generateSeedData({
    products: [
      mock.product({ categories: [mock.reference(category)] }),
      mock.product({ categories: undefined }),
    ],
    categories: [category],
  });

  describe("when used on nullable fields", () => {
    const qVariants = q.star.filterByType("product").project((sub) => ({
      categories: sub.field("categories[]").deref().field("name"),
      categoriesNotNull: sub
        .field("categories[]")
        .deref()
        .field("name")
        .notNull(),
    }));
    type Result = InferResultItem<typeof qVariants>;

    it("should have the correct type", () => {
      expectTypeOf<Result["categories"]>().toEqualTypeOf<string[] | null>();
      expectTypeOf<Result["categoriesNotNull"]>().toEqualTypeOf<string[]>();
    });

    it("should not affect the query", () => {
      expect(qVariants.query).toMatchInlineSnapshot(`
        "*[_type == "product"] {
            "categories": categories[]->.name,
            "categoriesNotNull": categories[]->.name
          }"
      `);
    });

    it("should execute correctly when there are no nulls", async () => {
      const results = await executeBuilder(qVariants, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "categories": [
              "Category Name",
            ],
            "categoriesNotNull": [
              "Category Name",
            ],
          },
          {
            "categories": [
              "Category Name",
            ],
            "categoriesNotNull": [
              "Category Name",
            ],
          },
        ]
      `);
    });

    it("should throw errors when finding a null value", async () => {
      await expect(() => executeBuilder(qVariants, dataWithNulls)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        [ValidationErrors: 1 Parsing Error:
        result[1].categoriesNotNull: Expected a non-null value]
      `);
    });
  });

  describe("when it's redundant", () => {
    it("should give a typescript error", () => {
      q.star.filterByType("flavour").project((sub) => ({
        test: sub
          .field("_id")
          // You must pass `true` to acknowledge the redundancy:
          .notNull(true),
        test2: sub
          .field("_id")
          // @ts-expect-error --- otherwise it will error:
          .notNull(),
      }));
    });
  });
});
