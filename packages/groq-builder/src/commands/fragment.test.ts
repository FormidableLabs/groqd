import { describe, it, expect } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { InferFragmentType, InferResultType } from "../types/public-types";
import { createGroqBuilder } from "../index";
import { TypeMismatchError } from "../types/utils";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });

describe("fragment", () => {
  // define a fragment:
  const variantFragment = q.fragment<SanitySchema.Variant>().project({
    name: q.infer(),
    price: q.infer(),
    slug: ["slug.current", q.infer()],
  });
  type VariantFragment = InferFragmentType<typeof variantFragment>;

  it("simple fragment should have the correct type", () => {
    expectType<VariantFragment>().toStrictEqual<{
      name: string;
      price: number;
      slug: string;
    }>();
  });

  const productFrag = q.fragment<SanitySchema.Product>().project((qP) => ({
    name: q.infer(),
    slug: ["slug.current", q.infer()],
    variants: qP
      .field("variants[]", q.infer())
      .deref()
      .project({
        ...variantFragment,
        msrp: q.infer(),
      }),
  }));
  type ProductFragment = InferFragmentType<typeof productFrag>;

  it("nested fragments should have the correct types", () => {
    expectType<ProductFragment>().toEqual<{
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
    expectType<InferResultType<typeof qVariants>>().toStrictEqual<
      Array<VariantFragment>
    >();

    expect(qVariants.query).toMatchInlineSnapshot(
      `
      "*[_type == \\"variant\\"] {
          name,
          price,
          \\"slug\\": slug.current
        }"
    `
    );
  });

  it("fragments can be spread in a query", () => {
    const qVariantsPlus = q.star.filterByType("variant").project({
      ...variantFragment,
      msrp: q.infer(),
    });
    expectType<InferResultType<typeof qVariantsPlus>>().toStrictEqual<
      Array<{ name: string; price: number; slug: string; msrp: number }>
    >();

    expect(qVariantsPlus.query).toMatchInlineSnapshot(
      `
      "*[_type == \\"variant\\"] {
          name,
          price,
          \\"slug\\": slug.current,
          msrp
        }"
    `
    );
  });

  it("should have errors if the variant is used incorrectly", () => {
    const qInvalid = q.star.filterByType("product").project(variantFragment);
    expectType<
      InferResultType<typeof qInvalid>[number]["price"]
    >().toStrictEqual<
      TypeMismatchError<{
        error: "⛔️ 'q.infer()' can only be used for known properties ⛔️";
        expected: keyof SanitySchema.Product;
        actual: "price";
      }>
    >();
  });

  it("can be composed", () => {
    const idFrag = q
      .fragment<SanitySchema.Variant>()
      .project({ id: q.infer() });
    const variantDetailsFrag = q.fragment<SanitySchema.Variant>().project({
      ...idFrag,
      ...variantFragment,
      msrp: q.infer(),
    });

    type VariantDetails = InferFragmentType<typeof variantDetailsFrag>;

    expectType<VariantDetails>().toStrictEqual<{
      slug: string;
      name: string;
      msrp: number;
      price: number;
      id: string | undefined;
    }>();
  });

  it("can be used to query multiple types", () => {
    const commonFrag = q
      .fragment<
        SanitySchema.Product | SanitySchema.Variant | SanitySchema.Category
      >()
      .project({
        _type: q.infer(),
        _id: q.infer(),
        name: q.infer(),
      });
    type CommonFrag = InferFragmentType<typeof commonFrag>;
    expectType<CommonFrag>().toStrictEqual<{
      _type: "product" | "variant" | "category";
      _id: string;
      name: string;
    }>();
  });

  describe("fragments can use conditionals", () => {
    const fragmentWithConditional = q
      .fragment<SanitySchema.Variant>()
      .project((qP) => ({
        name: q.infer(),
        ...qP.conditional$({
          "price == msrp": { onSale: q.value(false) },
          "price < msrp": {
            onSale: q.value(true),
            price: q.infer(),
            msrp: q.infer(),
          },
        }),
      }));
    const qConditional = q.star.filterByType("variant").project({
      slug: ["slug.current", q.infer()],
      ...fragmentWithConditional,
    });

    it("the inferred type is correct", () => {
      expectType<
        InferFragmentType<typeof fragmentWithConditional>
      >().toStrictEqual<
        | { name: string }
        | { name: string; onSale: false }
        | { name: string; onSale: true; price: number; msrp: number }
      >();
    });

    it("the fragment can be used in a query", () => {
      expectType<InferResultType<typeof qConditional>>().toStrictEqual<
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
        "*[_type == \\"variant\\"] {
            \\"slug\\": slug.current,
            name,
            price == msrp => {
              \\"onSale\\": false
            },
          price < msrp => {
              \\"onSale\\": true,
              price,
              msrp
            }
          }"
      `);
    });
  });
});
