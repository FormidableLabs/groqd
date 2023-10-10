import { aliasedType } from "@sanity-typed/types";
import { SchemaConfig } from "../sanity-types";
import { ExpandAliasValuesDeep } from "./schema-types";
import { expectType } from "../tests/expectType";

describe("", () => {
  type Flavour = SchemaConfig["TSchema"]["flavour"];
  type Product = SchemaConfig["TSchema"]["product"];
  type Category = SchemaConfig["TSchema"]["category"];

  type TestSchema = {
    a: string;
    obj: { O: "O" };
    nested: Array<{
      b: "B";
      flavour: {
        [aliasedType]: "flavour";
      };
    }>;
    product: { [aliasedType]: "product" };
    categories: Array<{ [aliasedType]: "category" }>;
  };

  it("", () => {
    expectType<
      ExpandAliasValuesDeep<TestSchema, SchemaConfig>
    >().toStrictEqual<{
      a: string;
      obj: { O: "O" };
      nested: Array<{
        b: "B";
        flavour: Flavour;
      }>;
      product: Product;
      categories: Array<Category>;
    }>();
  });
});
