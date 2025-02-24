import { describe, it, expect, expectTypeOf } from "vitest";
import { q } from "../../tests/schemas/nextjs-sanity-fe";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";
import { InferResultItem, InferResultType } from "../../groq-builder";

describe("count", () => {
  const data = mock.generateSeedData({
    products: mock.array(3, (i) =>
      mock.product({
        images: mock.array(i, () => mock.image({})),
      })
    ),
  });

  describe("as a root-level query", () => {
    const qProductCount = q.count(q.star.filterByType("product"));

    it("should have the correct type", () => {
      expectTypeOf<
        InferResultType<typeof qProductCount>
      >().toEqualTypeOf<number>();
    });
    it("should execute correctly", async () => {
      const productCount = await executeBuilder(qProductCount, data);
      expect(productCount).toEqual(data.products.length);
    });
  });

  describe("in a projection", () => {
    const qProducts = q.star.filterByType("product");
    const qCounts = qProducts.project((product) => ({
      imageCount: product.count("images[]"),
    }));

    it("can use a projection string", () => {
      expectTypeOf<InferResultItem<typeof qCounts>>().toEqualTypeOf<{
        imageCount: number | null;
      }>();
    });
    it("can use any nested groq expression", () => {
      const qCounts = qProducts.project((product) => ({
        imageCount: q.count(product.field("images[].asset").deref()),
      }));
      expectTypeOf<InferResultItem<typeof qCounts>>().toEqualTypeOf<{
        imageCount: number | null;
      }>();
    });
    it("the nested groq expression must be an array", () => {
      const _qCounts = qProducts.project((product) => ({
        invalid: q.count(
          // @ts-expect-error - Type 'number' is not assignable to type 'any[]'
          product.field("price")
        ),
      }));
    });

    it("executes correctly", async () => {
      const results = await executeBuilder(qCounts, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "imageCount": 0,
          },
          {
            "imageCount": 1,
          },
          {
            "imageCount": 2,
          },
        ]
      `);
    });
  });
});
