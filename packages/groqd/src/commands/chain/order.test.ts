import { describe, it, expect, expectTypeOf } from "vitest";
import { SanitySchema, q } from "../../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../../types/public-types";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";

const qVariants = q.star.filterByType("variant");

describe("order", () => {
  const data = mock.generateSeedData({
    variants: mock.array(10, (i) =>
      mock.variant({
        name: `Variant ${i}`,
        price: 100 - i,
        msrp: i < 5 ? 500 : 600,
      })
    ),
  });
  it("invalid types are caught", () => {
    // @ts-expect-error ---
    qVariants.order("INVALID");
    // @ts-expect-error ---
    qVariants.order("price FOO");
    // @ts-expect-error ---
    qVariants.order("INVALID desc");
  });
  it("result type is not changed", () => {
    expectTypeOf<InferResultType<typeof qVariants>>().toEqualTypeOf<
      Array<SanitySchema.Variant>
    >();

    const qOrder = qVariants.order("price");
    expectTypeOf<InferResultType<typeof qOrder>>().toEqualTypeOf<
      Array<SanitySchema.Variant>
    >();
  });
  it("query is compiled correctly", () => {
    const qOrder = qVariants.order("price");
    expect(qOrder).toMatchObject({
      query: `*[_type == "variant"] | order(price)`,
    });
  });
  it("can query deep types", () => {
    qVariants.order("slug.current");
    qVariants.order("slug.current asc");
    qVariants.order("slug.current desc");
    // Deeper:
    const qCatImg = q.star.filterByType("categoryImage");
    qCatImg.order("images.crop.top");
    qCatImg.order("images.hotspot.width asc");
  });
  it("you can order a query after a validated projection", () => {
    const query = qVariants
      .project({
        name: q.string(),
      })
      .order("name");
    expectTypeOf<InferResultType<typeof query>>().toEqualTypeOf<
      Array<{ name: string }>
    >();
    expect(query.query).toMatchInlineSnapshot(`
      "*[_type == "variant"] {
          name
        } | order(name)"
    `);
    expect(query.parser).toBeDefined();
  });

  const priceAsc = data.variants.slice().reverse();
  const priceDesc = data.variants.slice();

  it("should execute correctly (asc)", async () => {
    const qOrder = qVariants.order("price");
    const results = await executeBuilder(qOrder, data);
    expect(results).toMatchObject(priceAsc);
  });
  it("should execute correctly (desc)", async () => {
    const qOrder = qVariants.order("price desc");
    const results = await executeBuilder(qOrder, data);
    expect(results).toMatchObject(priceDesc);
  });

  it("asc", () => {
    const qOrder = qVariants.order("price asc");

    expect(qOrder).toMatchObject({
      query: `*[_type == "variant"] | order(price asc)`,
    });
  });
  it("desc", () => {
    const qOrder = qVariants.order("price desc");

    expect(qOrder).toMatchObject({
      query: `*[_type == "variant"] | order(price desc)`,
    });
  });

  describe("can sort by multiple fields", () => {
    it("invalid types are caught", () => {
      qVariants.order(
        //
        "price",
        // @ts-expect-error ---
        "INVALID"
      );
      qVariants.order(
        //
        "price",
        "msrp",
        // @ts-expect-error ---
        "INVALID"
      );
      qVariants.order(
        // @ts-expect-error ---
        "price INVALID",
        "msrp"
      );
    });
    it("query is built correctly", () => {
      const qOrder = qVariants.order("msrp", "price", "name");

      expect(qOrder.query).toEqual(
        `*[_type == "variant"] | order(msrp, price, name)`
      );
    });
    it("asc / desc", () => {
      const qOrder = qVariants.order("price asc", "msrp desc", "name asc");

      expect(qOrder.query).toEqual(
        `*[_type == "variant"] | order(price asc, msrp desc, name asc)`
      );
    });

    it("should execute correctly", async () => {
      const qOrder = qVariants.order("msrp", "price");
      const results = await executeBuilder(qOrder, data);
      expect(results).toMatchObject([
        { name: `Variant 4`, msrp: 500, price: 96 },
        { name: `Variant 3`, msrp: 500, price: 97 },
        { name: `Variant 2`, msrp: 500, price: 98 },
        { name: `Variant 1`, msrp: 500, price: 99 },
        { name: `Variant 0`, msrp: 500, price: 100 },
        { name: `Variant 9`, msrp: 600, price: 91 },
        { name: `Variant 8`, msrp: 600, price: 92 },
        { name: `Variant 7`, msrp: 600, price: 93 },
        { name: `Variant 6`, msrp: 600, price: 94 },
        { name: `Variant 5`, msrp: 600, price: 95 },
      ]);
    });
  });
});
