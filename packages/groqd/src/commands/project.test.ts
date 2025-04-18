import { describe, expect, expectTypeOf, it } from "vitest";
import { Simplify } from "type-fest";
import { createGroqBuilderLite } from "../index";
import {
  SanitySchema,
  SchemaConfig,
  z,
} from "../tests/schemas/nextjs-sanity-fe";
import { TypeMismatchError } from "../types/type-mismatch-error";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { currencyFormat } from "../tests/utils";
import { InferResultItem, InferResultType } from "../groq-builder";

const q = createGroqBuilderLite<SchemaConfig>({ indent: "" });

const qVariants = q.star.filterByType("variant");

describe("project (object projections)", () => {
  const data = mock.generateSeedData({
    variants: mock.array(5, (i) =>
      mock.variant({
        id: `variant-${i}`,
        name: `Variant ${i}`,
        price: 100 * i,
        msrp: 200 * i,
        slug: mock.slug({ current: `variant:${i}` }),
      })
    ),
  });

  describe("root projections", () => {
    const qRoot = q.project({
      productNames: q.star.filterByType("product").field("name"),
      categoryNames: q.star.filterByType("category").field("name"),
    });
    it("should have the correct type", () => {
      expectTypeOf<InferResultType<typeof qRoot>>().toEqualTypeOf<{
        productNames: string[];
        categoryNames: string[];
      }>();
    });

    it("should have the correct query", () => {
      expect(qRoot.query).toMatchInlineSnapshot(
        `" { "productNames": *[_type == "product"].name, "categoryNames": *[_type == "category"].name }"`
      );
    });

    it("should execute correctly", async () => {
      const data = mock.generateSeedData({
        products: mock.array(2, () => mock.product({})),
        categories: mock.array(3, () => mock.category({})),
      });
      const results = await executeBuilder(qRoot, data);
      expect(results).toMatchInlineSnapshot(`
        {
          "categoryNames": [
            "Category Name",
            "Category Name",
            "Category Name",
          ],
          "productNames": [
            "Name",
            "Name",
          ],
        }
      `);
    });
  });

  describe("a single plain property", () => {
    it("cannot use 'true' or a parser to project unknown properties", () => {
      // @ts-expect-error ---
      const qInvalid = qVariants.project({
        name: true,
        INVALID: true,
        INVALID_PARSER: z.string(),
      });

      expectTypeOf<InferResultType<typeof qInvalid>>().toEqualTypeOf<
        Array<{
          name: string;
          INVALID: TypeMismatchError<{
            error: `⛔️ 'true' can only be used for known properties; 'INVALID' is not known ⛔️`;
            expected: keyof SanitySchema.Variant;
            actual: "INVALID";
          }>;
          INVALID_PARSER: TypeMismatchError<{
            error: `⛔️ A parser can only be used for known properties; 'INVALID_PARSER' is not known ⛔️`;
            expected: keyof SanitySchema.Variant;
            actual: "INVALID_PARSER";
          }>;
        }>
      >();
    });

    const qName = qVariants.project({
      name: true,
    });
    it("query should be typed correctly", () => {
      expect(qName.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { name }"`
      );

      expectTypeOf<InferResultType<typeof qName>>().toEqualTypeOf<
        Array<{
          name: string;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qName, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "name": "Variant 0",
          },
          {
            "name": "Variant 1",
          },
          {
            "name": "Variant 2",
          },
          {
            "name": "Variant 3",
          },
          {
            "name": "Variant 4",
          },
        ]
      `);
    });
  });

  describe("multiple plain properties", () => {
    const qMultipleFields = qVariants.project({
      id: true,
      name: true,
      price: true,
      msrp: true,
    });
    it("query should be typed correctly", () => {
      expect(qMultipleFields.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { id, name, price, msrp }"`
      );

      expectTypeOf<InferResultType<typeof qMultipleFields>>().toEqualTypeOf<
        Array<{
          id: string | null;
          name: string;
          price: number;
          msrp: number;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qMultipleFields, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "id": "variant-0",
            "msrp": 0,
            "name": "Variant 0",
            "price": 0,
          },
          {
            "id": "variant-1",
            "msrp": 200,
            "name": "Variant 1",
            "price": 100,
          },
          {
            "id": "variant-2",
            "msrp": 400,
            "name": "Variant 2",
            "price": 200,
          },
          {
            "id": "variant-3",
            "msrp": 600,
            "name": "Variant 3",
            "price": 300,
          },
          {
            "id": "variant-4",
            "msrp": 800,
            "name": "Variant 4",
            "price": 400,
          },
        ]
      `);
    });
  });

  describe("projection with validation", () => {
    const qValidation = qVariants.project({
      name: z.string(),
      price: z.number(),
    });
    it("query should be typed correctly", () => {
      expect(qValidation.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { name, price }"`
      );

      expectTypeOf<InferResultType<typeof qValidation>>().toEqualTypeOf<
        Array<{
          name: string;
          price: number;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qValidation, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "name": "Variant 0",
            "price": 0,
          },
          {
            "name": "Variant 1",
            "price": 100,
          },
          {
            "name": "Variant 2",
            "price": 200,
          },
          {
            "name": "Variant 3",
            "price": 300,
          },
          {
            "name": "Variant 4",
            "price": 400,
          },
        ]
      `);
    });

    it("we should not be able to use the wrong parser type", () => {
      // @ts-expect-error ---
      const qNameInvalid = qVariants.project({
        name: z.number(),
        price: z.string(),
      });
      expectTypeOf<InferResultType<typeof qNameInvalid>>().toEqualTypeOf<
        Array<{
          name: TypeMismatchError<{
            error: `⛔️ The 'name' field has a data type that is not fully compatible with the specified parser ⛔️`;
            expected: number;
            actual: string;
          }>;
          price: TypeMismatchError<{
            error: `⛔️ The 'price' field has a data type that is not fully compatible with the specified parser ⛔️`;
            expected: string;
            actual: number;
          }>;
        }>
      >();

      // @ts-expect-error ---
      const qIdIsNullable = qVariants.project({
        id: z.string(),
      });
      expectTypeOf<InferResultType<typeof qIdIsNullable>>().toEqualTypeOf<
        Array<{
          id:
            | string
            | TypeMismatchError<{
                error: `⛔️ The 'id' field has a data type that is not fully compatible with the specified parser ⛔️`;
                expected: string;
                actual: null;
              }>;
        }>
      >();
    });
  });

  describe("a projection with naked projections", () => {
    const qNakedProjections = qVariants.project({
      NAME: "name",
      SLUG: "slug.current",
      msrp: "msrp",
    });

    it("invalid projections should have type errors", () => {
      // @ts-expect-error ---
      qVariants.project({ FIELD: "INVALID" });
      // @ts-expect-error ---
      qVariants.project({ FIELD: "slug.INVALID" });
      // @ts-expect-error ---
      qVariants.project({ FIELD: "INVALID.current" });
    });

    it("query should be correct", () => {
      expect(qNakedProjections.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { "NAME": name, "SLUG": slug.current, msrp }"`
      );
    });

    it("types should be correct", () => {
      expectTypeOf<InferResultType<typeof qNakedProjections>>().toEqualTypeOf<
        Array<{
          NAME: string;
          SLUG: string;
          msrp: number;
        }>
      >();
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
            .project(() => ({
              flavourName: "name",
              flavourType: "_type",

              variantName: "^.name",
              variantType: "^._type",

              productName: "^.^.name",
              productType: "^.^._type",
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

  describe("a projection with parent selectors", () => {
    const qDeep = qVariants.project((q) => ({
      flavour: q
        .field("flavour[]")
        .deref()
        .project((q) => ({
          _type: "_type",
          parentType: "^._type",
          parentTypeQ: q.field("^._type"),
        })),
    }));
    it("should infer the correct type", () => {
      type Actual = InferResultType<typeof qDeep>;
      expectTypeOf<Actual>().toEqualTypeOf<
        Array<{
          flavour: null | Array<{
            _type: "flavour";
            parentType: "variant";
            parentTypeQ: "variant";
          }>;
        }>
      >();
    });
  });

  describe("a projection with naked, validated projections", () => {
    const qNakedProjections = qVariants.project({
      NAME: ["name", z.string()],
      SLUG: ["slug.current", z.string()],
      msrp: ["msrp", z.number()],
    });

    it("invalid projections should have type errors", () => {
      // @ts-expect-error ---
      qVariants.project({ NAME: ["INVALID", z.number()] });
      // @ts-expect-error ---
      qVariants.project({ NAME: ["slug.INVALID", z.string()] });
      // @ts-expect-error ---
      qVariants.project({ NAME: ["INVALID.current", z.string()] });
    });

    it("query should be correct", () => {
      expect(qNakedProjections.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { "NAME": name, "SLUG": slug.current, msrp }"`
      );
    });

    it("types should be correct", () => {
      expectTypeOf<InferResultType<typeof qNakedProjections>>().toEqualTypeOf<
        Array<{
          NAME: string;
          SLUG: string;
          msrp: number;
        }>
      >();
    });
  });

  describe("a single complex project", () => {
    const qComplex = qVariants.project((q) => ({
      NAME: q.field("name"),
    }));

    it("query should be correct", () => {
      expect(qComplex.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { "NAME": name }"`
      );
    });

    it("types should be correct", () => {
      expectTypeOf<InferResultType<typeof qComplex>>().toEqualTypeOf<
        Array<{
          NAME: string;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qComplex, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "NAME": "Variant 0",
          },
          {
            "NAME": "Variant 1",
          },
          {
            "NAME": "Variant 2",
          },
          {
            "NAME": "Variant 3",
          },
          {
            "NAME": "Variant 4",
          },
        ]
      `);
    });
  });

  describe("multiple complex projections", () => {
    const qComplex = qVariants.project((q) => ({
      name: q.field("name"),
      slug: q.field("slug").field("current"),
      images: q.field("images[]").field("asset").deref().field("url"),
    }));

    it("query should be correct", () => {
      expect(qComplex.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { name, "slug": slug.current, "images": images[].asset->.url }"`
      );
    });

    it("types should be correct", () => {
      expectTypeOf<InferResultType<typeof qComplex>>().toEqualTypeOf<
        Array<{
          name: string;
          slug: string;
          images: Array<string | null> | null;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qComplex, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "images": [],
            "name": "Variant 0",
            "slug": "variant:0",
          },
          {
            "images": [],
            "name": "Variant 1",
            "slug": "variant:1",
          },
          {
            "images": [],
            "name": "Variant 2",
            "slug": "variant:2",
          },
          {
            "images": [],
            "name": "Variant 3",
            "slug": "variant:3",
          },
          {
            "images": [],
            "name": "Variant 4",
            "slug": "variant:4",
          },
        ]
      `);
    });
  });

  describe("nested projections", () => {
    const dataWithImages = mock.generateSeedData({
      variants: [
        mock.variant({ images: [mock.keyed(mock.image({}))] }),
        mock.variant({ images: [mock.keyed(mock.image({}))] }),
      ],
    });
    const qNested = qVariants.project((variant) => ({
      name: variant.field("name"),
      images: variant.field("images[]").project((image) => ({
        name: true,
        description: image.field("description").validate(z.string().nullable()),
      })),
    }));

    it("query should be correct", () => {
      expect(qNested.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { name, "images": images[] { name, description } }"`
      );
    });

    it("types should be correct", () => {
      expectTypeOf<InferResultType<typeof qNested>>().toEqualTypeOf<
        Array<{
          name: string;
          images: Array<{
            name: string;
            description: string | null;
          }> | null;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qNested, dataWithImages);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "images": [
              {
                "description": "Product Image",
                "name": "ProductImage",
              },
            ],
            "name": "Variant Name",
          },
          {
            "images": [
              {
                "description": "Product Image",
                "name": "ProductImage",
              },
            ],
            "name": "Variant Name",
          },
        ]
      `);
    });

    it("nested objects should be validated", async () => {
      const dataWithInvalidData = [
        mock.variant({
          images: [
            mock.keyed(
              mock.image({
                // @ts-expect-error ---
                description: 1234,
              })
            ),
          ],
        }),
      ];
      await expect(() =>
        executeBuilder(qNested, { datalake: dataWithInvalidData })
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
        [ValidationErrors: 1 Parsing Error:
        result[0].images[0].description: Expected string, received number]
      `);
    });
  });

  describe("mixed projections", () => {
    const qComplex = qVariants.project((q) => ({
      name: true,
      slug: q.field("slug").field("current"),
      price: true,
      IMAGES: q.field("images[]").field("name"),
    }));

    it("query should be correct", () => {
      expect(qComplex.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { name, "slug": slug.current, price, "IMAGES": images[].name }"`
      );
    });

    it("types should be correct", () => {
      expectTypeOf<InferResultType<typeof qComplex>>().toEqualTypeOf<
        Array<{
          name: string;
          slug: string;
          price: number;
          IMAGES: Array<string> | null;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qComplex, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "IMAGES": [],
            "name": "Variant 0",
            "price": 0,
            "slug": "variant:0",
          },
          {
            "IMAGES": [],
            "name": "Variant 1",
            "price": 100,
            "slug": "variant:1",
          },
          {
            "IMAGES": [],
            "name": "Variant 2",
            "price": 200,
            "slug": "variant:2",
          },
          {
            "IMAGES": [],
            "name": "Variant 3",
            "price": 300,
            "slug": "variant:3",
          },
          {
            "IMAGES": [],
            "name": "Variant 4",
            "price": 400,
            "slug": "variant:4",
          },
        ]
      `);
    });
  });

  describe("validation", () => {
    it("without validation, the parser should be null", () => {
      const qWithoutValidation = qVariants.project({ name: true, price: true });
      expect(qWithoutValidation.parser).toBeNull();
    });

    const qParser = qVariants.project((sub) => ({
      name: true,
      msrp: sub.field("msrp").validate((msrp) => currencyFormat(msrp)),
      price: sub.field("price").validate(z.number()),
    }));

    it("the types should match", () => {
      expectTypeOf<InferResultType<typeof qParser>>().toEqualTypeOf<
        Array<{
          name: string;
          msrp: string;
          price: number;
        }>
      >();
    });
    it("the query shouldn't be affected", () => {
      expect(qParser.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { name, msrp, price }"`
      );
    });
    it("should execute correctly", async () => {
      const results = await executeBuilder(qParser, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "msrp": "$0.00",
            "name": "Variant 0",
            "price": 0,
          },
          {
            "msrp": "$200.00",
            "name": "Variant 1",
            "price": 100,
          },
          {
            "msrp": "$400.00",
            "name": "Variant 2",
            "price": 200,
          },
          {
            "msrp": "$600.00",
            "name": "Variant 3",
            "price": 300,
          },
          {
            "msrp": "$800.00",
            "name": "Variant 4",
            "price": 400,
          },
        ]
      `);
    });

    it("should throw when the data doesn't match", async () => {
      const invalidData = [
        ...data.datalake,
        mock.variant({
          // @ts-expect-error ---
          price: "INVALID",
        }),
      ];

      await expect(() => executeBuilder(qParser, { datalake: invalidData }))
        .rejects.toThrowErrorMatchingInlineSnapshot(`
        [ValidationErrors: 1 Parsing Error:
        result[5].price: Expected number, received string]
      `);
    });
  });

  describe("with validationRequired", () => {
    const q = createGroqBuilderLite<SchemaConfig>({
      validationRequired: true,
      indent: "  ",
    });
    const qVariant = q.star.filterByType("variant").slice(0);

    it("should throw if a projection uses 'true'", () => {
      expect(() =>
        qVariant.project({
          price: true,
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: [MISSING_PROJECTION_VALIDATION] Because 'validationRequired' is enabled, every field must have validation (like \`z.string()\`), but the following fields are missing it: "price"]`
      );
    });
    it("should throw if a projection uses a naked projection", () => {
      expect(() =>
        qVariant.project({
          price: "price",
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: [MISSING_PROJECTION_VALIDATION] Because 'validationRequired' is enabled, every field must have validation (like \`z.string()\`), but the following fields are missing it: "price"]`
      );
    });
    it("should throw if a nested projection is missing a parser", () => {
      expect(() =>
        qVariant.project((qV) => ({
          nested: qV.field("price"),
        }))
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: [MISSING_PROJECTION_VALIDATION] Because 'validationRequired' is enabled, every field must have validation (like \`z.string()\`), but the following fields are missing it: "nested"]`
      );
    });
    it("should throw when using ellipsis operator ...", () => {
      expect(() =>
        qVariant.project({
          "...": true,
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: [MISSING_PROJECTION_VALIDATION] Because 'validationRequired' is enabled, every field must have validation (like \`z.string()\`), but the following fields are missing it: "..."]`
      );
    });
    it("should work just fine when validation is provided", () => {
      const qNormal = qVariant.project((qV) => ({
        price: z.number(),
        price2: ["price", z.number()],
        price3: qV.field("price", z.number()),
        price4: qV.field("price").validate(z.number()),
      }));
      expect(qNormal.query).toMatchInlineSnapshot(`
        "*[_type == "variant"][0] {
            price,
            "price2": price,
            "price3": price,
            "price4": price
          }"
      `);
      expectTypeOf<InferResultItem<typeof qNormal>>().toEqualTypeOf<{
        price: number;
        price2: number;
        price3: number;
        price4: number;
      }>();
    });
  });

  describe("ellipsis ... operator", () => {
    describe("when set to 'true'", () => {
      const qEllipsis = qVariants.project((sub) => ({
        "...": true,
        OTHER: sub.field("name"),
      }));

      it("query should be correct", () => {
        expect(qEllipsis.query).toMatchInlineSnapshot(
          `"*[_type == "variant"] { ..., "OTHER": name }"`
        );
      });

      it("types should be correct", () => {
        expectTypeOf<InferResultType<typeof qEllipsis>>().toEqualTypeOf<
          Array<
            Simplify<
              SanitySchema.Variant & {
                OTHER: string;
              }
            >
          >
        >();
      });

      it("should not need to introduce runtime parsing", () => {
        expect(qEllipsis.parser).toBeNull();
      });

      it("should execute correctly", async () => {
        const results = await executeBuilder(qEllipsis, data);
        expect(results).toEqual(
          data.variants.map((variant) => ({
            ...variant,
            OTHER: variant.name,
          }))
        );
      });
    });

    describe("when set to a parser", () => {
      const qEllipsisWithParser = qVariants.project({
        "...": z.object({
          name: z.string(),
          msrp: z.number(),
        }),
        price: z.number(),
      });

      it("a parser is created", () => {
        expect(qEllipsisWithParser.parser).not.toBeNull();
      });

      it("executes correctly", async () => {
        const results = await executeBuilder(qEllipsisWithParser, data);
        expect(results).toEqual(
          data.variants.map((variant) => ({
            name: variant.name,
            msrp: variant.msrp,
            price: variant.price,
          }))
        );
      });

      it("should throw when the data doesn't match", async () => {
        const invalidData = [
          ...data.datalake,
          mock.variant({
            // @ts-expect-error ---
            msrp: "INVALID",
          }),
        ];

        await expect(() =>
          executeBuilder(qEllipsisWithParser, { datalake: invalidData })
        ).rejects.toThrowErrorMatchingInlineSnapshot(`
          [ValidationErrors: 1 Parsing Error:
          result[5].msrp: Expected number, received string]
        `);
      });
    });

    describe("when other fields have parsers", () => {
      const qEllipsis = qVariants.project((sub) => ({
        "...": true,
        VALIDATED: sub.field("name", z.string().toUpperCase()),
      }));

      it("query should be correct", () => {
        expect(qEllipsis.query).toMatchInlineSnapshot(
          `"*[_type == "variant"] { ..., "VALIDATED": name }"`
        );
      });

      it("types should be correct", () => {
        expectTypeOf<InferResultType<typeof qEllipsis>>().toEqualTypeOf<
          Array<
            Simplify<
              SanitySchema.Variant & {
                VALIDATED: string;
              }
            >
          >
        >();
      });

      it("should include runtime parsing", () => {
        expect(qEllipsis.parser).not.toBeNull();
      });

      it("should execute correctly", async () => {
        const results = await executeBuilder(qEllipsis, data);
        expect(results).toEqual(
          data.variants.map((variant) => ({
            ...variant,
            VALIDATED: variant.name.toUpperCase(),
          }))
        );
      });
    });

    describe("when fields are overridden", () => {
      const overridden = qVariants.project((sub) => ({
        "...": true,
        style: sub.field("style[]").deref(),
      }));

      type Item = InferResultItem<typeof overridden>;

      it("normal properties get passed through", () => {
        // Properties like flavour should be included by "...":
        expectTypeOf<Item["flavour"]>().toEqualTypeOf<
          SanitySchema.Variant["flavour"]
        >();
      });
      it("the overridden properties are correctly typed", () => {
        type StyleReferences = SanitySchema.Variant["style"];
        expectTypeOf<Item["style"]>().not.toEqualTypeOf<StyleReferences>();

        type OverriddenStyle = SanitySchema.Style[] | null;
        expectTypeOf<Item["style"]>().toEqualTypeOf<OverriddenStyle>();
      });
    });
  });
});
