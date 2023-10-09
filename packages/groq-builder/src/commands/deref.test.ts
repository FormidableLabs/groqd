import { createGroqBuilder } from "../groq-builder";
import { expectType } from "../test-utils/expectType";
import { _referenced } from "@sanity-typed/types";
import { ExtractScope } from "../utils/common-types";

type SchemaForDeref = {
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
  TSchema: SchemaForDeref;
  referenced: typeof _referenced;
}>();

describe("deref", () => {
  const productRefs = q.filterByType("category").field("products[]");
  const categoryRef = q.filterByType("product").field("category");
  it("", () => {
    const res = productRefs.deref();
    expectType<ExtractScope<typeof res>>().toStrictEqual<
      Array<SchemaForDeref["product"]>
    >();
    expect(q).toMatchObject({
      query: `*[_type == 'category'].products[]->`,
    });
  });
  it("", () => {
    const res = categoryRef.deref();
    expectType<ExtractScope<typeof res>>().toStrictEqual<
      SchemaForDeref["category"]
    >();
    expect(q).toMatchObject({
      query: `*[_type == 'product'].category->`,
    });
  });
});
