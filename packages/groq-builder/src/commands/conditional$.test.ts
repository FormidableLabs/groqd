import { describe, it } from "vitest";
import { createGroqBuilder } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { ExtractConditionalProjectionTypes } from "./conditional-types";
import { expectType } from "../tests/expectType";

const q = createGroqBuilder<SchemaConfig>();

describe("conditional$", () => {
  it("by itself, we should be able to extract the union of projection types", () => {
    const qConditional = q.star.filterByType("variant").conditional$({
      '_type == "foo"': {
        name: true,
        price: true,
      },
      '_type == "bar"': {
        name: true,
        msrp: true,
      },
    });

    expectType<
      ExtractConditionalProjectionTypes<typeof qConditional>
    >().toStrictEqual<
      { name: string; price: number } | { name: string; msrp: number }
    >();
  });
});
