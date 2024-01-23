import { describe, expect, it } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { InferResultType } from "../types/public-types";
import { Simplify, TypeMismatchError } from "../types/utils";
import { createGroqBuilder } from "../index";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { currencyFormat } from "../tests/utils";
import { zod } from "../validation/zod";

const q = createGroqBuilder<SchemaConfig>().include(zod);
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
      expectType<InferResultType<typeof qRoot>>().toStrictEqual<{
        productNames: string[];
        categoryNames: string[];
      }>();
    });

    it("should have the correct query", () => {
      expect(qRoot.query).toMatchInlineSnapshot(
        '" { \\"productNames\\": *[_type == \\"product\\"].name, \\"categoryNames\\": *[_type == \\"category\\"].name }"'
      );
    });

    it("should execute correctly", async () => {
      const data = mock.generateSeedData({
        products: mock.array(2, () => mock.product({})),
        categories: mock.array(3, () => mock.category({})),
      });
      const results = await executeBuilder(qRoot, data.datalake);
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
    it("cannot use 'true' to project unknown properties", () => {
      const qInvalid = qVariants.project({
        INVALID: q.infer(),
      });

      expectType<InferResultType<typeof qInvalid>>().toStrictEqual<
        Array<{
          INVALID: TypeMismatchError<{
            error: `⛔️ 'q.infer()' can only be used for known properties ⛔️`;
            expected: keyof SanitySchema.Variant;
            actual: "INVALID";
          }>;
        }>
      >();
    });

    const qName = qVariants.project({
      name: q.infer(),
    });
    it("query should be typed correctly", () => {
      expect(qName.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { name }"'
      );

      expectType<InferResultType<typeof qName>>().toStrictEqual<
        Array<{
          name: string;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qName, data.datalake);
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
      id: q.infer(),
      name: q.infer(),
      price: q.infer(),
      msrp: q.infer(),
    });
    it("query should be typed correctly", () => {
      expect(qMultipleFields.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { id, name, price, msrp }"'
      );

      expectType<InferResultType<typeof qMultipleFields>>().toStrictEqual<
        Array<{
          id: string | undefined;
          name: string;
          price: number;
          msrp: number;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qMultipleFields, data.datalake);
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
      name: zod.string(),
      price: zod.number(),
    });
    it("query should be typed correctly", () => {
      expect(qValidation.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { name, price }"'
      );

      expectType<InferResultType<typeof qValidation>>().toStrictEqual<
        Array<{
          name: string;
          price: number;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qValidation, data.datalake);
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
        '"*[_type == \\"variant\\"] { \\"NAME\\": name, \\"SLUG\\": slug.current, msrp }"'
      );
    });

    it("types should be correct", () => {
      expectType<InferResultType<typeof qNakedProjections>>().toStrictEqual<
        Array<{
          NAME: string;
          SLUG: string;
          msrp: number;
        }>
      >();
    });
  });

  describe("a projection with naked, validated projections", () => {
    const qNakedProjections = qVariants.project({
      NAME: ["name", zod.string()],
      SLUG: ["slug.current", zod.string()],
      msrp: ["msrp", zod.number()],
    });

    it("invalid projections should have type errors", () => {
      // @ts-expect-error ---
      qVariants.project({ NAME: ["INVALID", zod.number()] });
      // @ts-expect-error ---
      qVariants.project({ NAME: ["slug.INVALID", zod.string()] });
      // @ts-expect-error ---
      qVariants.project({ NAME: ["INVALID.current", zod.string()] });
    });

    it("query should be correct", () => {
      expect(qNakedProjections.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { \\"NAME\\": name, \\"SLUG\\": slug.current, msrp }"'
      );
    });

    it("types should be correct", () => {
      expectType<InferResultType<typeof qNakedProjections>>().toStrictEqual<
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
        '"*[_type == \\"variant\\"] { \\"NAME\\": name }"'
      );
    });

    it("types should be correct", () => {
      expectType<InferResultType<typeof qComplex>>().toStrictEqual<
        Array<{
          NAME: string;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qComplex, data.datalake);
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
      images: q.field("images[]").field("name"),
    }));

    it("query should be correct", () => {
      expect(qComplex.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { name, \\"slug\\": slug.current, \\"images\\": images[].name }"'
      );
    });

    it("types should be correct", () => {
      expectType<InferResultType<typeof qComplex>>().toStrictEqual<
        Array<{
          name: string;
          slug: string;
          images: Array<string> | null;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qComplex, data.datalake);
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
    const { datalake: dataWithImages } = mock.generateSeedData({
      variants: [
        mock.variant({ images: [mock.keyed(mock.image({}))] }),
        mock.variant({ images: [mock.keyed(mock.image({}))] }),
      ],
    });
    const qNested = qVariants.project((variant) => ({
      name: variant.field("name"),
      images: variant.field("images[]").project((image) => ({
        name: q.infer(),
        description: image
          .field("description")
          .validate(zod.nullToUndefined(zod.string().optional())),
      })),
    }));

    it("query should be correct", () => {
      expect(qNested.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { name, \\"images\\": images[] { name, description } }"'
      );
    });

    it("types should be correct", () => {
      expectType<InferResultType<typeof qNested>>().toStrictEqual<
        Array<{
          name: string;
          images: Array<{
            name: string;
            description: string | undefined;
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
      await expect(() => executeBuilder(qNested, dataWithInvalidData)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        "1 Parsing Error:
        result[0].images[0].description: Expected string, received 1234"
      `);
    });
  });

  describe("mixed projections", () => {
    const qComplex = qVariants.project((qV) => ({
      name: q.infer(),
      slug: qV.field("slug").field("current"),
      price: q.infer(),
      IMAGES: qV.field("images[]").field("name"),
    }));

    it("query should be correct", () => {
      expect(qComplex.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { name, \\"slug\\": slug.current, price, \\"IMAGES\\": images[].name }"'
      );
    });

    it("types should be correct", () => {
      expectType<InferResultType<typeof qComplex>>().toStrictEqual<
        Array<{
          name: string;
          slug: string;
          price: number;
          IMAGES: Array<string> | null;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qComplex, data.datalake);
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
    const qParser = qVariants.project((qV) => ({
      name: q.infer(),
      msrp: qV.field("msrp").validate((msrp) => currencyFormat(msrp)),
      price: qV.field("price").validate(zod.number()),
    }));

    it("the types should match", () => {
      expectType<InferResultType<typeof qParser>>().toStrictEqual<
        Array<{
          name: string;
          msrp: string;
          price: number;
        }>
      >();
    });
    it("the query shouldn't be affected", () => {
      expect(qParser.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { name, msrp, price }"'
      );
    });
    it("should execute correctly", async () => {
      const results = await executeBuilder(qParser, data.datalake);
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

      await expect(() => executeBuilder(qParser, invalidData)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        "1 Parsing Error:
        result[5].price: Expected number, received \\"INVALID\\""
      `);
    });
  });

  describe("ellipsis ... operator", () => {
    const qEllipsis = qVariants.project((qV) => ({
      "...": q.infer(),
      OTHER: qV.field("name"),
    }));
    it("query should be correct", () => {
      expect(qEllipsis.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { ..., \\"OTHER\\": name }"'
      );
    });

    it("types should be correct", () => {
      expectType<InferResultType<typeof qEllipsis>>().toStrictEqual<
        Array<Simplify<SanitySchema.Variant & { OTHER: string }>>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qEllipsis, data.datalake);
      expect(results).toEqual(
        data.variants.map((v) => {
          // @ts-expect-error ---
          v.OTHER = v.name;
          return v;
        })
      );
    });
  });
});
