import { describe, expect, expectTypeOf, it } from "vitest";
import { InferResultType } from "../../index";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";
import { q, SanitySchema } from "../../tests/schemas/nextjs-sanity-fe";

describe("self", () => {
  const example = q.star.filterByType("variant").project((q) => ({
    self: q.self,
    refs: q.field("flavour[]").project((q) => ({
      _type: true,
      dereferenced: q.self.deref().field("name"),
    })),
  }));
  it("should have the correct type", () => {
    expectTypeOf<InferResultType<typeof example>>().toEqualTypeOf<
      Array<{
        self: SanitySchema.Variant;
        refs: null | Array<{
          _type: "reference";
          dereferenced: null | string;
        }>;
      }>
    >();
  });
  it("should generate the correct query", () => {
    expect(example.query).toMatchInlineSnapshot(`
      "*[_type == "variant"] {
          "self": @,
          "refs": flavour[] {
            _type,
            "dereferenced": @->
          }
        }"
    `);
  });

  it("should execute correctly", async () => {
    const flavour = mock.flavour({ name: "Flavour 1" });
    const data = mock.generateSeedData({
      variants: [
        mock.variant({
          flavour: [mock.reference(flavour)],
        }),
      ],
      extraData: [flavour],
    });
    const results = await executeBuilder(example.slice(0), data);
    expect(results).toMatchInlineSnapshot(`
      {
        "ref": [
          {
            "_type": "reference",
            "dereferenced": {
              "_createdAt": "2025-04-13T20:00:26.798Z",
              "_id": "flavour:1",
              "_rev": "0",
              "_type": "flavour",
              "_updatedAt": "2025-04-13T20:00:26.798Z",
              "name": "Flavour 1",
              "slug": {
                "_type": "slug",
                "current": "slug:flavour:1",
              },
            },
          },
        ],
        "self": {
          "_createdAt": "2025-04-13T20:00:26.798Z",
          "_id": "variant:1",
          "_rev": "0",
          "_type": "variant",
          "_updatedAt": "2025-04-13T20:00:26.798Z",
          "description": [],
          "flavour": [
            {
              "_key": "reference:key:1",
              "_ref": "flavour:1",
              "_type": "reference",
            },
          ],
          "id": "variant:1",
          "images": [],
          "msrp": 0,
          "name": "Variant Name",
          "price": 0,
          "slug": {
            "_type": "slug",
            "current": "slug:variant:1",
          },
          "style": [],
        },
      }
    `);
  });
});
