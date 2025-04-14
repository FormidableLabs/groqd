import { describe, expect, expectTypeOf, it } from "vitest";
import { InferResultType } from "../../index";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";
import { q } from "../../tests/schemas/nextjs-sanity-fe";

describe("self", () => {
  const example = q.star.filterByType("variant").project((q) => ({
    self: q.self.project({ _type: true }),
    refs: q.field("flavour[]").project((q) => ({
      _type: true,
      dereferenced: q.self.deref().project({ _type: true }),
    })),
  }));
  it("should have the correct type", () => {
    expectTypeOf<InferResultType<typeof example>>().toEqualTypeOf<
      Array<{
        self: { _type: "variant" };
        refs: null | Array<{
          _type: "reference";
          dereferenced: { _type: "flavour" };
        }>;
      }>
    >();
  });
  it("should generate the correct query", () => {
    expect(example.query).toMatchInlineSnapshot(`
      "*[_type == "variant"] {
          "self": @ {
            _type
          },
          "refs": flavour[] {
            _type,
            "dereferenced": @-> {
              _type
            }
          }
        }"
    `);
  });

  it("should execute correctly", async () => {
    const flavour = mock.flavour({});
    const variant = mock.variant({
      flavour: [mock.reference(flavour)],
    });
    const data = mock.generateSeedData({
      variants: [variant],
      extraData: [flavour],
    });
    const results = await executeBuilder(example, data);
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "refs": [
            {
              "_type": "reference",
              "dereferenced": {
                "_type": "flavour",
              },
            },
          ],
          "self": {
            "_type": "variant",
          },
        },
      ]
    `);
  });
});
