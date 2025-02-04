import { describe, expectTypeOf, it } from "vitest";
import { q } from "./tests/schemas/nextjs-sanity-fe";
import { InferResultItem } from "./types/public-types";
import { SanityContentBlocks } from "./validation/content-blocks";

describe("example queries", () => {
  describe("portable text", () => {
    // This is the type for ContentBlocks generated from Sanity:

    // There are various ways to query the content:

    it("can be queried without client-side validation", () => {
      const qText = q.star.filterByType("product").project((sub) => ({
        description: sub.field("description[]"),
      }));
      expectTypeOf<InferResultItem<typeof qText>>().toMatchTypeOf<{
        description: null | SanityContentBlocks;
      }>();
    });
    it("can be queried via q.contentBlocks()", () => {
      const qText = q.star.filterByType("product").project((sub) => ({
        description: sub.field("description[]", q.contentBlocks().nullable()),
      }));
      expectTypeOf<
        InferResultItem<typeof qText>["description"]
      >().toEqualTypeOf<null | SanityContentBlocks>();
    });
    it("can be queried conditionally based on type", () => {
      const qText = q.star.filterByType("product").project((sub) => ({
        description: sub.field("description[]").project((desc) => ({
          ...desc.conditionalByType({
            block: {
              "...": true,
            },
          }),
        })),
      }));
      expectTypeOf<
        InferResultItem<typeof qText>["description"]
      >().toMatchTypeOf<null | SanityContentBlocks>();
    });
  });
});
