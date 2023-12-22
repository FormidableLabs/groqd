import { describe, it, expect } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { InferResultType } from "../types/public-types";
import { createGroqBuilder } from "../index";
import { TypeMismatchError } from "../types/utils";
import { InferFragmentType } from "./fragment";

const q = createGroqBuilder<SchemaConfig>();

describe("fragment", () => {
  // define a fragment:
  const variantFragment = q.fragment<SanitySchema.Variant>().project({
    name: true,
    price: true,
    slug: "slug.current",
  });
  type VariantFragment = InferFragmentType<typeof variantFragment>;

  it("should have the correct type", () => {
    expectType<VariantFragment>().toStrictEqual<{
      name: string;
      price: number;
      slug: string;
    }>();
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

  it("should have the correct types", () => {
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

    expect(qVariants.query).toMatchInlineSnapshot();
  });
  it("fragments can be spread in a query", () => {
    const qVariantsPlus = q.star.filterByType("variant").project({
      ...variantFragment,
      msrp: true,
    });
    expectType<InferResultType<typeof qVariantsPlus>>().toStrictEqual<
      Array<{ name: string; price: number; slug: string; msrp: number }>
    >();
  });

  it("should have errors if the variant is used incorrectly", () => {
    const qInvalid = q.star.filterByType("product").project(variantFragment);
    expectType<
      InferResultType<typeof qInvalid>[number]["price"]
    >().toStrictEqual<
      TypeMismatchError<{
        error: "⛔️ 'true' can only be used for known properties ⛔️";
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
        _type: true,
        _id: true,
        name: true,
      });
    type CommonFrag = InferFragmentType<typeof commonFrag>;
    expectType<CommonFrag>().toStrictEqual<{
      _type: "product" | "variant" | "category";
      _id: string;
      name: string;
    }>();
  });
});
