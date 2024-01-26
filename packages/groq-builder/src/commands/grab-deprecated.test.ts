import { describe, expect, it } from "vitest";
import { expectType } from "../tests/expectType";
import { InferResultType } from "../types/public-types";
import { createGroqBuilder } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { zod } from "../validation/zod";

const q = createGroqBuilder<SchemaConfig>();
const qVariants = q.star.filterByType("variant");

describe("grab (backwards compatibility)", () => {
  it("should be defined", () => {
    expect(q.grab).toBeTypeOf("function");
    expect(q.grab$).toBeTypeOf("function");
    expect(q.grabOne).toBeTypeOf("function");
    expect(q.grabOne$).toBeTypeOf("function");
  });

  it("should be type-safe", () => {
    const qGrab = qVariants.grab((q) => ({
      name: q.infer(),
      slug: ["slug.current", zod.string()],
      msrp: ["msrp", zod.number()],
      styles: q
        .grabOne("style[]", q.infer())
        .deref()
        .grabOne("name", q.infer()),
    }));

    expectType<InferResultType<typeof qGrab>>().toStrictEqual<
      Array<{
        name: string;
        slug: string;
        msrp: number;
        styles: Array<string> | null;
      }>
    >();
  });
});
