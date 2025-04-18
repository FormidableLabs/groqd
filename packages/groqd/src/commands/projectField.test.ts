import { describe, expect, expectTypeOf, it } from "vitest";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { SanitySchema, q } from "../tests/schemas/nextjs-sanity-fe";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { getSubquery } from "../tests/getSubquery";
import { InferResultItem, InferResultType, z } from "../index";

describe("field (naked projections)", () => {
  const qVariants = q.star.filterByType("variant");
  const qPrices = qVariants.field("price");
  const qNames = qVariants.field("name");
  const qId = qVariants.field("id");
  const qImages = qVariants.field("images[]");
  type ImagesArray = NonNullable<SanitySchema.Variant["images"]>;
  const data = mock.generateSeedData({
    variants: mock.array(5, (i) =>
      mock.variant({
        name: `Variant ${i}`,
        price: 55 + i,
        msrp: 55 + i,
      })
    ),
  });

  it("can project a number", () => {
    expectTypeOf<InferResultType<typeof qPrices>>().toEqualTypeOf<
      Array<number>
    >();
    expect(qPrices.query).toMatchInlineSnapshot(
      `"*[_type == "variant"].price"`
    );
  });
  it("can project a string", () => {
    expectTypeOf<InferResultType<typeof qNames>>().toEqualTypeOf<
      Array<string>
    >();
    expect(qNames.query).toMatchInlineSnapshot(`"*[_type == "variant"].name"`);
  });
  it("can project a nullable string", () => {
    expectTypeOf<InferResultType<typeof qId>>().toEqualTypeOf<
      Array<string | null>
    >();
  });
  it("can project arrays with []", () => {
    type ResultType = InferResultType<typeof qImages>;
    expectTypeOf<ResultType>().toEqualTypeOf<Array<null | ImagesArray>>();
  });
  it("can chain projections", () => {
    const qSlugCurrent = qVariants.field("slug").field("current");
    expectTypeOf<InferResultType<typeof qSlugCurrent>>().toEqualTypeOf<
      Array<string>
    >();

    const qImageNames = qVariants
      .slice(0)
      .field("images[]")
      .field("name")
      .notNull();
    expectTypeOf<InferResultType<typeof qImageNames>>().toEqualTypeOf<
      Array<string>
    >();
  });

  it("executes correctly (price)", async () => {
    const results = await executeBuilder(qPrices, data);
    expect(results).toMatchInlineSnapshot(`
      [
        55,
        56,
        57,
        58,
        59,
      ]
    `);
  });
  it("executes correctly (name)", async () => {
    const results = await executeBuilder(qNames, data);
    expect(results).toMatchInlineSnapshot(`
      [
        "Variant 0",
        "Variant 1",
        "Variant 2",
        "Variant 3",
        "Variant 4",
      ]
    `);
  });

  describe("deep properties", () => {
    it("invalid entries should have TS errors", () => {
      // @ts-expect-error ---
      qVariants.field("slug[]");
      // @ts-expect-error ---
      qVariants.field("slug.INVALID");
      // @ts-expect-error ---
      qVariants.field("INVALID");
      // @ts-expect-error ---
      qVariants.field("INVALID.current");
    });

    it("can project nested properties", () => {
      const qSlugs = qVariants.field("slug.current");
      expectTypeOf<InferResultType<typeof qSlugs>>().toEqualTypeOf<
        Array<string>
      >();
      expect(qSlugs.query).toMatchInlineSnapshot(
        `"*[_type == "variant"].slug.current"`
      );
    });

    it("can project arrays with []", () => {
      const qImages = qVariants.field("images[]");
      type ResultType = InferResultType<typeof qImages>;

      expectTypeOf<ResultType>().toEqualTypeOf<Array<ImagesArray | null>>();
    });

    it("can correctly project deeply optional values", () => {
      type DeepOptional = {
        image?: {
          asset?: {
            _type: "reference";
          };
        };
      };
      const sub = getSubquery(q).as<DeepOptional>();
      const query = sub.field("image.asset");
      expectTypeOf<InferResultType<typeof query>>().toEqualTypeOf<null | {
        _type: "reference";
      }>();
    });
  });

  describe("validation", () => {
    it("when no validation present, the parser should be null", () => {
      expect(qPrices.parser).toBeNull();
    });

    const qPrice = qVariants.slice(0).field("price", z.number()).notNull();
    it("should have the correct result type", () => {
      expectTypeOf<InferResultType<typeof qPrice>>().toEqualTypeOf<number>();
    });
    it("should result in the right query", () => {
      expect(qPrice.query).toMatchInlineSnapshot(
        `"*[_type == "variant"][0].price"`
      );
    });
    it("should execute correctly", async () => {
      const results = await executeBuilder(qPrice, data);
      expect(results).toMatchInlineSnapshot("55");
    });
    it("should throw an error if the data is invalid", async () => {
      const invalidData = mock.generateSeedData({
        variants: [
          mock.variant({
            // @ts-expect-error ---
            price: "INVALID",
          }),
        ],
      });
      await expect(() => executeBuilder(qPrice, invalidData)).rejects
        .toMatchInlineSnapshot(`
        [ValidationErrors: 1 Parsing Error:
        result: Expected number, received string]
      `);
    });

    describe("with arrays of data", () => {
      const qPrices = qVariants.field("price", z.number());
      it("should execute correctly", async () => {
        const results = await executeBuilder(qPrices, data);
        expect(results).toMatchInlineSnapshot(`
          [
            55,
            56,
            57,
            58,
            59,
          ]
        `);
      });
      it("should throw for invalid values", () => {
        expect(qPrices.parse([55, 56])).toEqual([55, 56]);
        expect(qPrices.parse(56)).toEqual(56);

        expect(() => {
          qPrices.parse([55, "56"]);
        }).toThrowErrorMatchingInlineSnapshot(`
          [ValidationErrors: 1 Parsing Error:
          result[1]: Expected number, received string]
        `);
      });
    });
  });

  describe('self selector "@"', () => {
    it("can select entire object", () => {
      const qSelf = qVariants.project((q) => ({
        self: q.field("@"),
      }));
      type Actual = InferResultType<typeof qSelf>;
      type Expected = Array<{ self: SanitySchema.Variant }>;
      expectTypeOf<Actual>().toMatchTypeOf<Expected>();
    });
    it("can be used to dereference elements", () => {
      const qSelf = qVariants.project((q) => ({
        flavour: q.field("flavour[]").project((q) => ({
          _type: q.field("_type"),
          dereferenced: q.field("@").deref(),
        })),
      }));
      type Actual = InferResultType<typeof qSelf>;
      expectTypeOf<Actual>().toEqualTypeOf<
        Array<{
          flavour: null | Array<{
            _type: "reference";
            dereferenced: SanitySchema.Flavour;
          }>;
        }>
      >();
    });
  });

  describe('parent selector "^"', () => {
    describe("with filterBy", () => {
      const query = q.star.filterByType("variant").project((sub) => ({
        flavours: sub.field("flavour[]").filterBy("references(^._id)").deref(),
      }));

      it("should have the correct type", () => {
        type ResultItem = InferResultItem<typeof query>;

        expectTypeOf<ResultItem>().toEqualTypeOf<{
          flavours: null | Array<SanitySchema.Flavour>;
        }>();
      });
    });
    describe("can select parent fields", () => {
      const query = q.star.filterByType("product").project((product) => ({
        _type: true,
        categories: product
          .field("categories[]")
          .deref()
          .project((cat) => ({
            _type: true,
            productType: cat.field("^._type"),
            productName: cat.field("^.name"),
          })),
      }));
      type Result = InferResultItem<typeof query>;
      it("should have the correct type", () => {
        expectTypeOf<Result>().toEqualTypeOf<{
          _type: "product";
          categories: null | Array<{
            _type: "category";
            productType: "product";
            productName: string;
          }>;
        }>();
      });
    });

    describe("deep parent selectors ^.^.", () => {
      const query = q.star.filterByType("product").project((q) => ({
        variants: q
          .field("variants[]")
          .deref()
          .project((q) => ({
            flavour: q
              .field("flavour[]")
              .deref()
              .project((q) => ({
                flavourName: q.field("name"),
                flavourType: q.field("_type"),

                variantName: q.field("^.name"),
                variantType: q.field("^._type"),

                productName: q.field("^.^.name"),
                productType: q.field("^.^._type"),
              })),
          })),
      }));

      const flavour = mock.flavour({ name: "FLAVOR" });
      const variant = mock.variant({
        name: "VARIANT",
        flavour: [mock.reference(flavour)],
      });
      const product = mock.product({
        name: "PRODUCT",
        variants: [mock.reference(variant)],
      });
      const data = { datalake: [flavour, variant, product] };

      it("should generate the correct type", () => {
        type Actual = InferResultType<typeof query>;
        type Expected = Array<{
          variants: null | Array<{
            flavour: null | Array<{
              flavourName: string | null;
              flavourType: "flavour";

              variantName: string;
              variantType: "variant";

              productName: string;
              productType: "product";
            }>;
          }>;
        }>;
        expectTypeOf<Actual>().toEqualTypeOf<Expected>();
      });
      it("should execute correctly", async () => {
        const results = await executeBuilder(query, data);
        expect(results).toMatchInlineSnapshot(`
          [
            {
              "variants": [
                {
                  "flavour": [
                    {
                      "flavourName": "FLAVOR",
                      "flavourType": "flavour",
                      "productName": "PRODUCT",
                      "productType": "product",
                      "variantName": "VARIANT",
                      "variantType": "variant",
                    },
                  ],
                },
              ],
            },
          ]
        `);
      });
    });
  });
});
