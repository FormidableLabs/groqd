import { describe, it, expect } from "vitest";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { ExtractDocumentTypes } from "../utils/schema-types";
import { createGroqBuilder } from "../index";

const _referenced = Symbol("_referenced");
type TestSchema_For_Deref = {
  category: {
    _id: string;
    _type: "category";
    products: Array<{
      _type: "reference";
      _ref: string;
      [_referenced]: "product";
    }>;
  };
  product: {
    _id: string;
    _type: "product";
    category: { _type: "reference"; _ref: string; [_referenced]: "category" };
  };
};

const q = createGroqBuilder<{
  documentTypes: ExtractDocumentTypes<TestSchema_For_Deref>;
  referenceSymbol: typeof _referenced;
}>();

describe("deref", () => {
  const productRefs = q.star.filterByType("category").projection("products[]");
  const categoryRef = q.star.filterByType("product").projection("category");
  it("", () => {
    const res = productRefs.deref();
    expectType<ExtractScope<typeof res>>().toStrictEqual<
      Array<Array<TestSchema_For_Deref["product"]>>
    >();
    expect(q).toMatchObject({
      query: `*[_type == 'category'].products[]->`,
    });
  });
  it("", () => {
    const res = categoryRef.deref();
    expectType<ExtractScope<typeof res>>().toStrictEqual<
      Array<TestSchema_For_Deref["category"]>
    >();
    expect(q).toMatchObject({
      query: `*[_type == 'product'].category->`,
    });
  });
});
