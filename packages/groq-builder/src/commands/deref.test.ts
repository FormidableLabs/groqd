import { describe, it, expect } from "vitest";
import { createGroqBuilder } from "../groq-builder";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { _referenced } from "../tests/schemas/nextjs-sanity-fe";

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
  TSchema: TestSchema_For_Deref;
  referenceSymbol: typeof _referenced;
}>();

describe("deref", () => {
  const productRefs = q.filterByType("category").field("products[]");
  const categoryRef = q.filterByType("product").field("category");
  it("", () => {
    const res = productRefs.deref();
    expectType<ExtractScope<typeof res>>().toStrictEqual<
      Array<TestSchema_For_Deref["product"]>
    >();
    expect(q).toMatchObject({
      query: `*[_type == 'category'].products[]->`,
    });
  });
  it("", () => {
    const res = categoryRef.deref();
    expectType<ExtractScope<typeof res>>().toStrictEqual<
      TestSchema_For_Deref["category"]
    >();
    expect(q).toMatchObject({
      query: `*[_type == 'product'].category->`,
    });
  });
});
