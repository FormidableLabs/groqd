import { describe, expect, expectTypeOf, it } from "vitest";
import { q } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultItem, InferResultType } from "../types/public-types";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

describe("raw", () => {
  const qRaw = q.star
    .slice(0, 2)
    .raw<Array<{ ANYTHING: string | null }>>(`{ ANYTHING }`);
  const data = mock.generateSeedData({});

  it("should be typed correctly", () => {
    expectTypeOf<InferResultType<typeof qRaw>>().toEqualTypeOf<
      Array<{ ANYTHING: string | null }>
    >();
  });

  it("should append the query correctly", () => {
    expect(qRaw.query).toMatchInlineSnapshot('"*[0...2]{ ANYTHING }"');
  });

  it("should execute correctly", async () => {
    const result = await executeBuilder(qRaw, data);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "ANYTHING": null,
        },
        {
          "ANYTHING": null,
        },
      ]
    `);
  });

  it("should allow totally invalid syntax", () => {
    const qInvalid = q.raw<{ NEVER: "gonna" }>(
      `give you up, never gonna let you down`
    );
    expectTypeOf<InferResultType<typeof qInvalid>>().toEqualTypeOf<{
      NEVER: "gonna";
    }>();

    expect(qInvalid.query).toMatchInlineSnapshot(
      '"give you up, never gonna let you down"'
    );
  });

  describe("with runtime validation", () => {
    const data = mock.generateSeedData({
      products: [
        mock.product({ images: mock.array(2, () => mock.image({})) }),
        mock.product({ images: mock.array(3, () => mock.image({})) }),
        mock.product({ images: mock.array(4, () => mock.image({})) }),
      ],
    });
    const qRawValidate = q.star.filterByType("product").project(() => ({
      imageCount: q.raw("count(images[])", q.number()),
      coalesce: q.raw("coalesce(INVALID, name)", q.string()),
      null: q.raw("INVALID", q.string().nullable()),
    }));

    it("should infer types correctly", () => {
      expectTypeOf<InferResultItem<typeof qRawValidate>>().toEqualTypeOf<{
        imageCount: number;
        coalesce: string;
        null: string | null;
      }>();
    });
    it("raw query should be fine", () => {
      expect(qRawValidate.query).toMatchInlineSnapshot(`
        "*[_type == "product"] {
            "imageCount": count(images[]),
            "coalesce": coalesce(INVALID, name),
            "null": INVALID
          }"
      `);
    });
    it("should execute correctly", async () => {
      const result = await executeBuilder(qRawValidate, data);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "coalesce": "Name",
            "imageCount": 2,
            "null": null,
          },
          {
            "coalesce": "Name",
            "imageCount": 3,
            "null": null,
          },
          {
            "coalesce": "Name",
            "imageCount": 4,
            "null": null,
          },
        ]
      `);
    });
    it("should throw if the data is invalid", async () => {
      const data = mock.generateSeedData({
        products: [
          mock.product({ images: undefined }),
          mock.product({ name: undefined }),
          mock.product({
            // @ts-expect-error ---
            INVALID: 0,
          }),
        ],
      });
      await expect(() => executeBuilder(qRawValidate, data)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        [ValidationErrors: 4 Parsing Errors:
        result[0].imageCount: Expected number, received null
        result[1].coalesce: Expected string, received null
        result[2].coalesce: Expected string, received number
        result[2].null: Expected string, received number]
      `);
    });
  });
});
