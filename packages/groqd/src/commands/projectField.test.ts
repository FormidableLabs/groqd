import { describe, expect, expectTypeOf, it } from "vitest";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { InferResultType } from "../types/public-types";
import { SanitySchema, q } from "../tests/schemas/nextjs-sanity-fe";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { zod } from "../index";

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
      const query = q.as<DeepOptional>().field("image.asset");
      expectTypeOf<InferResultType<typeof query>>().toEqualTypeOf<null | {
        _type: "reference";
      }>();
    });
  });

  describe("validation", () => {
    it("when no validation present, the parser should be null", () => {
      expect(qPrices.parser).toBeNull();
    });

    const qPrice = qVariants.slice(0).field("price", zod.number()).notNull();
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
      const qPrices = qVariants.field("price", zod.number());
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
});
