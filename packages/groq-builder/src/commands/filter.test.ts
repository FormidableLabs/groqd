import { describe, it, expect, expectTypeOf } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../types/public-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>();
const qVariants = q.star.filterByType("variant");

describe("filter", () => {
  it("should allow for untyped filter expressions", () => {
    const qAnything = qVariants.filter("ANYTHING");
    expectTypeOf<InferResultType<typeof qAnything>>().toEqualTypeOf<
      Array<SanitySchema.Variant>
    >();
    expect(qAnything.query).toMatchInlineSnapshot(
      '"*[_type == \\"variant\\"][ANYTHING]"'
    );
  });

  const qFiltered = qVariants
    .filter('name == "FOO"')
    .project({ name: true, id: true });
  const data = mock.generateSeedData({
    variants: [
      mock.variant({ id: "1", name: "FOO" }),
      mock.variant({ id: "2", name: "BAR" }),
      mock.variant({ id: "3", name: "BAZ" }),
    ],
  });

  it("should not change the result type", () => {
    const qFiltered = qVariants.filter("ANYTHING");
    expectTypeOf<InferResultType<typeof qVariants>>().toEqualTypeOf<
      InferResultType<typeof qFiltered>
    >();
  });

  it("should execute correctly", async () => {
    const results = await executeBuilder(qFiltered, data);
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "id": "1",
          "name": "FOO",
        },
      ]
    `);
  });
});

describe("filterBy", () => {
  const qFiltered = q.star
    .filterBy('_type == "variant"')
    .project({ _type: true });
  const data = mock.generateSeedData({});

  it("should not allow invalid expressions", () => {
    qVariants.filterBy(
      // @ts-expect-error ---
      "INVALID"
    );
    qVariants.filterBy(
      // @ts-expect-error ---
      "invalid == null"
    );
  });
  it("should allow strongly-typed filters", () => {
    qVariants.filterBy('_type == "variant"');
    qVariants.filterBy('name == ""');
    qVariants.filterBy('name == "anything"');
    qVariants.filterBy("price == 55");
    qVariants.filterBy("id == null");
    qVariants.filterBy('id == "id"');
  });
  it("should not allow mismatched types", () => {
    qVariants.filterBy(
      // @ts-expect-error ---
      "name == null"
    );
    qVariants.filterBy(
      // @ts-expect-error ---
      "name == 999"
    );
    qVariants.filterBy(
      // @ts-expect-error ---
      'price == "hello"'
    );
  });
  it("should not change the result type", () => {
    const unfiltered = q.star;
    const filtered = q.star.filterBy('_type == "variant"');
    expectTypeOf<InferResultType<typeof unfiltered>>().toEqualTypeOf<
      InferResultType<typeof filtered>
    >();
  });
  it("should execute correctly", async () => {
    const results = await executeBuilder(qFiltered.slice(0, 2), data);
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "_type": "variant",
        },
        {
          "_type": "variant",
        },
      ]
    `);
  });

  describe("with variables", () => {
    type Variables = {
      str: string;
      num: number;
    };
    const qWithVars = qVariants.variables<Variables>();
    it("should support strongly-typed variables", () => {
      qWithVars.filterBy("name == $str");
      qWithVars.filterBy("price == $num");
    });
    it("should fail for invalid / mismatched variables", () => {
      qWithVars.filterBy(
        // @ts-expect-error ---
        "name == $num"
      );
      qWithVars.filterBy(
        // @ts-expect-error ---
        "name == $INVALID"
      );
      qWithVars.filterBy(
        // @ts-expect-error ---
        "price == $str"
      );
      qWithVars.filterBy(
        // @ts-expect-error ---
        "price == $INVALID"
      );
    });
  });
});
