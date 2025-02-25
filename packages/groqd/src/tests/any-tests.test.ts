import { describe, expectTypeOf, it } from "vitest";
import { InferFragmentType, InferResultType } from "../types/public-types";
import { createGroqBuilderLite, z } from "../index";

describe("when using createGroqBuilder<any>()", () => {
  const q = createGroqBuilderLite<any>();

  describe("a normal query", () => {
    const query = q.star.filterByType("variant").project((sub) => ({
      name: z.string(),
      price: z.number(),
      categoryNames: sub
        .field("categories[]")
        .deref()
        .field("name", z.string()),
    }));
    it("should have the right type", () => {
      expectTypeOf<InferResultType<typeof query>>().toEqualTypeOf<
        Array<{
          name: string;
          price: number;
          categoryNames: null | string | string[];
        }>
      >();
    });
  });
  describe("a fragment", () => {
    const frag = q.fragment<any>().project((sub) => ({
      name: z.string(),
      price: z.number(),
      categoryNames: sub
        .field("categories[]")
        .deref()
        .field("name", z.string()),
    }));
    it("should have the right type", () => {
      expectTypeOf<InferFragmentType<typeof frag>>().toEqualTypeOf<{
        name: string;
        price: number;
        categoryNames: null | string | string[];
      }>();
    });
  });
});
