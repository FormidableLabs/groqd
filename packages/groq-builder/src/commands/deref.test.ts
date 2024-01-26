import { describe, expect, it } from "vitest";
import { expectType } from "../tests/expectType";
import { InferResultType } from "../types/public-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";

const q = createGroqBuilder<SchemaConfig>();
const data = mock.generateSeedData({});

describe("deref", () => {
  const qProduct = q.star.filterByType("product").slice(0);
  const qCategoryRef = qProduct.field("categories[]", q.infer()).slice(0);
  const qCategory = qCategoryRef.deref();
  const qVariantsRefs = qProduct.field("variants[]", q.infer());
  const qVariants = qVariantsRefs.deref();

  it("should deref a single item", () => {
    expectType<
      InferResultType<typeof qCategory>
    >().toEqual<SanitySchema.Category | null>();
    expect(qCategory.query).toMatchInlineSnapshot(
      '"*[_type == \\"product\\"][0].categories[][0]->"'
    );
  });

  it("should deref an array of items", () => {
    expectType<
      InferResultType<typeof qVariants>
    >().toStrictEqual<Array<SanitySchema.Variant> | null>();
    expect(qVariants.query).toMatchInlineSnapshot(
      '"*[_type == \\"product\\"][0].variants[]->"'
    );
  });

  it("should be an error if the item is not a reference", () => {
    const notAReference = qProduct.field("slug", q.infer());
    expectType<InferResultType<typeof notAReference>>().toStrictEqual<{
      _type: "slug";
      current: string;
    }>();

    const res = notAReference.deref();
    type ErrorResult = InferResultType<typeof res>;
    expectType<
      ErrorResult["error"]
    >().toStrictEqual<"⛔️ Expected the object to be a reference type ⛔️">();
  });

  it("should execute correctly (single)", async () => {
    const results = await executeBuilder(qCategory, data.datalake);
    expect(results).toEqual(data.categories[0]);
  });
  it("should execute correctly (multiple)", async () => {
    const results = await executeBuilder(qVariants, data.datalake);
    expect(results).toEqual(data.variants);
  });
});
