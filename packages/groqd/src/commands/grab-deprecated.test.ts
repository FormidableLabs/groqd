import { describe, expect, expectTypeOf, it } from "vitest";
import { InferResultType } from "../types/public-types";
import { q, z } from "../tests/schemas/nextjs-sanity-fe";

const qVariants = q.star.filterByType("variant");

describe("grab (backwards compatibility)", () => {
  it("should be defined", () => {
    expect(q.grab).toBeTypeOf("function");
    expect(q.grab$).toBeTypeOf("function");
    expect(q.grabOne).toBeTypeOf("function");
    expect(q.grabOne$).toBeTypeOf("function");
  });

  it("should be type-safe", () => {
    const qGrab = qVariants.grab((sub) => ({
      name: true,
      slug: "slug.current",
      msrp: ["msrp", z.number()],
      styles: sub.grabOne("style[]").deref().grabOne("name"),
    }));

    expectTypeOf<InferResultType<typeof qGrab>>().toEqualTypeOf<
      Array<{
        name: string;
        slug: string;
        msrp: number;
        styles: Array<string | null> | null;
      }>
    >();
  });
});
