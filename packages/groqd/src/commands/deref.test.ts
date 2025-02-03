import { describe, expect, expectTypeOf, it } from "vitest";
import { InferResultItem, InferResultType } from "../types/public-types";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { q, SanitySchema } from "../tests/schemas/nextjs-sanity-fe";

const data = mock.generateSeedData({});

describe("deref", () => {
  const qProduct = q.star.filterByType("product").slice(0);
  const qCategoryRef = qProduct.field("categories[]").slice(0);
  const qCategory = qCategoryRef.deref();
  const qVariantsRefs = qProduct.field("variants[]");
  const qVariants = qVariantsRefs.deref();

  it("should deref a single item", () => {
    expectTypeOf<
      InferResultItem<typeof qCategory>
    >().toEqualTypeOf<SanitySchema.Category>();
    expect(qCategory.query).toMatchInlineSnapshot(
      `"*[_type == "product"][0].categories[][0]->"`
    );
  });

  it("should deref an array of items", () => {
    expectTypeOf<InferResultType<typeof qVariants>>().toEqualTypeOf<
      SanitySchema.Variant[] | null
    >();
    expect(qVariants.query).toMatchInlineSnapshot(
      `"*[_type == "product"][0].variants[]->"`
    );
  });

  it("should be an error if the item is not a reference", () => {
    const notAReference = qProduct.field("slug");
    expectTypeOf<
      InferResultItem<typeof notAReference>
    >().toEqualTypeOf<SanitySchema.Slug>();

    const res = notAReference.deref();
    type ErrorResult = InferResultItem<typeof res>;
    expectTypeOf<
      ErrorResult["error"]
    >().toEqualTypeOf<"⛔️ Expected the object to be a reference type ⛔️">();
  });

  it("should execute correctly (single)", async () => {
    const results = await executeBuilder(qCategory, data);
    expect(results).toEqual(data.categories[0]);
  });
  it("should execute correctly (multiple)", async () => {
    const results = await executeBuilder(qVariants, data);
    expect(results).toEqual(data.variants);
  });

  describe("as part of a projection", () => {
    it("should deref an array of fields", () => {
      const query = q.star.filterByType("product").project((sub) => ({
        categories: sub.field("categories[]").deref(),
      }));

      expectTypeOf<InferResultItem<typeof query>>().toEqualTypeOf<{
        categories: SanitySchema.Category[] | null;
      }>();
    });
  });
});
