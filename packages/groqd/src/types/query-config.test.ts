import { describe, expectTypeOf, it } from "vitest";
import { SanitySchema } from "../tests/schemas/nextjs-sanity-fe";
import {
  ConfigAddParameters,
  ConfigCreateNestedScope,
  QueryConfig,
} from "./query-config";

describe("ConfigCreateNestedScope", () => {
  it("should work for various depths", () => {
    type Depth1_ = ConfigAddParameters<QueryConfig, { param: 999 }>;
    type Depth1 = ConfigCreateNestedScope<Depth1_, SanitySchema.Category>;
    expectTypeOf<Depth1["scope"]>().toEqualTypeOf<{
      "@": SanitySchema.Category;
      $param: 999;
    }>();

    type Depth2 = ConfigCreateNestedScope<Depth1, SanitySchema.Variant>;
    expectTypeOf<Depth2["scope"]>().toMatchTypeOf<{
      "@": SanitySchema.Variant;
      "^": SanitySchema.Category;
      $param: 999;
    }>();

    type Depth3 = ConfigCreateNestedScope<Depth2, SanitySchema.Flavour>;
    expectTypeOf<Depth3["scope"]>().toMatchTypeOf<{
      "@": SanitySchema.Flavour;
      "^": SanitySchema.Variant & {
        "^": SanitySchema.Category;
      };
      $param: 999;
    }>();
  });
});
