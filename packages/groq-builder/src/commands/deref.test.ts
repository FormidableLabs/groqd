import { describe, expect, it } from "vitest";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";

const q = createGroqBuilder<SchemaConfig>();
const data = mock.generateSeedData({});

describe("deref", () => {
  const qProduct = q.star.filterByType("product").slice(0);
  const qCategoryRef = qProduct.projection("categories[]").slice(0).deref();
  const qVariantsRefs = qProduct.projection("variants[]").deref();

  it("should deref a single item", () => {
    expectType<
      ExtractScope<typeof qCategoryRef>
    >().toStrictEqual<SanitySchema.Category>();
    expect(qCategoryRef.query).toMatchInlineSnapshot(
      '"*[_type == \\"product\\"][0].categories[][0]->"'
    );
  });

  it("should deref an array of items", () => {
    expectType<ExtractScope<typeof qVariantsRefs>>().toStrictEqual<
      Array<SanitySchema.Variant>
    >();
    expect(qVariantsRefs.query).toMatchInlineSnapshot(
      '"*[_type == \\"product\\"][0].variants[]->"'
    );
  });

  it("should be an error if the item is not a reference", () => {
    const notAReference = qProduct.projection("slug");

    const res = notAReference.deref();

    type ErrorResult = ExtractScope<typeof res>;
    expectType<
      ErrorResult["error"]
    >().toStrictEqual<"Expected the object to be a reference type">();
  });

  it("should execute correctly (single)", async () => {
    const results = await executeBuilder(data.datalake, qCategoryRef);
    expect(results).toEqual(data.categories[0]);
  });
  it("should execute correctly (multiple)", async () => {
    const results = await executeBuilder(data.datalake, qVariantsRefs);
    expect(results).toEqual(data.variants);
  });
});
