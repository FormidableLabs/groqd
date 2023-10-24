import { describe, it, expect } from "vitest";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { ExtractDocumentTypes } from "../utils/schema-types";
import { createGroqBuilder } from "../index";

const _referenced: unique symbol = Symbol("_referenced");
type Category = {
  _id: string;
  _type: "category";
  products: Array<{
    _type: "reference";
    _ref: string;
    [_referenced]: "product";
  }>;
};
type Product = {
  _id: string;
  _type: "product";
  category: { _type: "reference"; _ref: string; [_referenced]: "category" };
  notAReference: { data: string };
};
type TestSchema_For_Deref = {
  category: Category;
  product: Product;
};

const q = createGroqBuilder<{
  documentTypes: ExtractDocumentTypes<TestSchema_For_Deref>;
  referenceSymbol: typeof _referenced;
}>();

describe("deref", () => {
  const categoryRef = q.star
    .filterByType("product")
    .slice(0)
    .projection("category");

  const productsRefs = q.star
    .filterByType("category")
    .slice(0)
    .projection("products[]");

  it("should deref a single item", () => {
    const res = categoryRef.deref();
    expectType<ExtractScope<typeof res>>().toStrictEqual<Category>();
    expect(res.query).toMatchInlineSnapshot(
      '"*[_type == \\"product\\"][0].category->"'
    );
  });

  it("should deref an array of items", () => {
    const res = productsRefs.deref();
    expectType<ExtractScope<typeof res>>().toStrictEqual<Array<Product>>();
    expect(res.query).toMatchInlineSnapshot(
      '"*[_type == \\"category\\"][0].products[]->"'
    );
  });

  it("should be an error if the item is not a reference", () => {
    const notAReference = q.star
      .filterByType("product")
      .slice(0)
      .projection("notAReference");

    const res = notAReference.deref();

    type ErrorResult = ExtractScope<typeof res>;
    expectType<
      ErrorResult["error"]
    >().toStrictEqual<"Expected the object to be a reference type">();
  });
});
