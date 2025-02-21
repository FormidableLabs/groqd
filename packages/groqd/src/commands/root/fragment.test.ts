import { describe, it, expect, expectTypeOf } from "vitest";
import { SanitySchema, q, zod } from "../../tests/schemas/nextjs-sanity-fe";
import { InferFragmentType, InferResultType } from "../../types/public-types";
import { TypeMismatchError } from "../../types/type-mismatch-error";

describe("fragment", () => {
  // define a fragment:
  const variantFragment = q.fragment<SanitySchema.Variant>().project({
    name: true,
    price: true,
    slug: "slug.current",
  });
  type VariantFragment = InferFragmentType<typeof variantFragment>;

  it("simple fragment should have the correct type", () => {
    expectTypeOf<VariantFragment>().toEqualTypeOf<{
      name: string;
      price: number;
      slug: string;
    }>();
  });

  it("supports proper error reporting for invalid projections", () => {
    // @ts-expect-error ---
    q.fragment<SanitySchema.Variant>().project({ INVALID: true });
    // @ts-expect-error ---
    q.fragment<SanitySchema.Variant>().project({ name: "INVALID" });
    // @ts-expect-error ---
    q.fragment<SanitySchema.Variant>().project({ slug: "slug.INVALID" });
  });

  const productFrag = q.fragment<SanitySchema.Product>().project((qP) => ({
    name: true,
    slug: "slug.current",
    variants: qP
      .field("variants[]")
      .deref()
      .project({
        ...variantFragment,
        msrp: true,
      }),
  }));
  type ProductFragment = InferFragmentType<typeof productFrag>;

  it("nested fragments should have the correct types", () => {
    expectTypeOf<ProductFragment>().toEqualTypeOf<{
      name: string;
      slug: string;
      variants: null | Array<{
        name: string;
        price: number;
        slug: string;
        msrp: number;
      }>;
    }>();
  });

  it("fragments can be used in a query", () => {
    const qVariants = q.star.filterByType("variant").project(variantFragment);
    expectTypeOf<InferResultType<typeof qVariants>>().toEqualTypeOf<
      Array<VariantFragment>
    >();

    expect(qVariants.query).toMatchInlineSnapshot(
      `
      "*[_type == "variant"] {
          name,
          price,
          "slug": slug.current
        }"
    `
    );
  });

  it("fragments can be spread in a query", () => {
    const qVariantsPlus = q.star.filterByType("variant").project({
      ...variantFragment,
      msrp: true,
    });
    expectTypeOf<InferResultType<typeof qVariantsPlus>>().toEqualTypeOf<
      Array<{ name: string; price: number; slug: string; msrp: number }>
    >();

    expect(qVariantsPlus.query).toMatchInlineSnapshot(
      `
      "*[_type == "variant"] {
          name,
          price,
          "slug": slug.current,
          msrp
        }"
    `
    );
  });

  it("should have errors if the variant is used incorrectly", () => {
    // @ts-expect-error ---
    const qInvalid = q.star.filterByType("product").project(variantFragment);
    expectTypeOf<
      InferResultType<typeof qInvalid>[number]["price"]
    >().toEqualTypeOf<
      TypeMismatchError<{
        error: "⛔️ 'true' can only be used for known properties; 'price' is not known ⛔️";
        expected: keyof SanitySchema.Product;
        actual: "price";
      }>
    >();
  });

  it("can be composed", () => {
    const idFrag = q.fragment<SanitySchema.Variant>().project({ id: true });
    const variantDetailsFrag = q.fragment<SanitySchema.Variant>().project({
      ...idFrag,
      ...variantFragment,
      msrp: true,
    });

    type VariantDetails = InferFragmentType<typeof variantDetailsFrag>;

    expectTypeOf<VariantDetails>().toEqualTypeOf<{
      slug: string;
      name: string;
      msrp: number;
      price: number;
      id: string | null;
    }>();
  });

  it("can be used to query multiple types", () => {
    const commonFrag = q
      .fragment<
        SanitySchema.Product | SanitySchema.Variant | SanitySchema.Category
      >()
      .project({
        _type: true,
        _id: true,
        name: true,
      });
    type CommonFrag = InferFragmentType<typeof commonFrag>;
    expectTypeOf<CommonFrag>().toEqualTypeOf<{
      _type: "product" | "variant" | "category";
      _id: string;
      name: string;
    }>();
  });

  describe("fragments can use conditionals", () => {
    const fragmentWithConditional = q
      .fragment<SanitySchema.Variant>()
      .project((qP) => ({
        name: true,
        ...qP.conditional({
          "price == msrp": { onSale: q.value(false) },
          "price < msrp": { onSale: q.value(true), price: true, msrp: true },
        }),
      }));
    const qConditional = q.star.filterByType("variant").project({
      slug: "slug.current",
      ...fragmentWithConditional,
    });

    it("the inferred type is correct", () => {
      expectTypeOf<
        InferFragmentType<typeof fragmentWithConditional>
      >().toEqualTypeOf<
        | { name: string }
        | { name: string; onSale: false }
        | { name: string; onSale: true; price: number; msrp: number }
      >();
    });

    it("the fragment can be used in a query", () => {
      expectTypeOf<InferResultType<typeof qConditional>>().toEqualTypeOf<
        Array<
          | { slug: string; name: string }
          | { slug: string; name: string; onSale: false }
          | {
              slug: string;
              name: string;
              onSale: true;
              price: number;
              msrp: number;
            }
        >
      >();
    });

    it("the query is compiled correctly", () => {
      expect(qConditional.query).toMatchInlineSnapshot(`
        "*[_type == "variant"] {
            "slug": slug.current,
            name,
            price == msrp => {
                "onSale": false
              },
            price < msrp => {
                "onSale": true,
                price,
                msrp
              }
          }"
      `);
    });
  });

  describe("fragmentForType", () => {
    const variantFrag = q.fragmentForType<"variant">().project({
      name: true,
      price: true,
      slug: "slug.current",
    });
    type VariantFragType = InferFragmentType<typeof variantFrag>;

    it("simple named fragment should have the correct type", () => {
      expectTypeOf<VariantFragType>().toEqualTypeOf<{
        name: string;
        price: number;
        slug: string;
      }>();
    });
  });

  describe("fragment<any>", () => {
    const anyFrag = q.fragment<any>().project({
      foo: zod.string(),
      bar: zod.number(),
    });
    type AnyFragType = InferFragmentType<typeof anyFrag>;
    it("simple fragment should have the correct type", () => {
      expectTypeOf<AnyFragType>().toEqualTypeOf<{
        foo: string;
        bar: number;
      }>();
    });
  });
});
