import { describe, expectTypeOf, it } from "vitest";
import { zod } from "../index";
import { InferFragmentType } from "../types/fragment-types";
import { InferResultType } from "../groq-builder";
import { createGroqBuilderLite } from "../createGroqBuilder";

describe("when using createGroqBuilder<any>()", () => {
  const q = createGroqBuilderLite<any>();

  describe("a normal query", () => {
    const query = q.star.filterByType("variant").project((sub) => ({
      name: zod.string(),
      price: zod.number(),
      categoryNames: sub
        .field("categories[]")
        .deref()
        .field("name", zod.string()),
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
      name: zod.string(),
      price: zod.number(),
      categoryNames: sub
        .field("categories[]")
        .deref()
        .field("name", zod.string()),
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
