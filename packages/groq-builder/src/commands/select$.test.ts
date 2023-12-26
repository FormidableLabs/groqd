import { describe, expect, it } from "vitest";
import { createGroqBuilder, InferResultType } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });

describe("select$", () => {
  const qBase = q.star.filterByType("variant", "product", "category");

  describe("with a default value", () => {
    const qSelect = qBase.project({
      selected: q.select$(
        {
          '_type == "variant"': q.value("VARIANT"),
          '_type == "product"': q.value("PRODUCT"),
        },
        q.value("OTHER")
      ),
    });

    const data = mock.generateSeedData({
      variants: mock.array(2, () => mock.variant({})),
      products: mock.array(3, () => mock.product({})),
      categories: mock.array(4, () => mock.category({})),
    });

    it("the result types should be correct", () => {
      expectType<InferResultType<typeof qSelect>>().toStrictEqual<
        Array<{
          selected: "VARIANT" | "PRODUCT" | "OTHER";
        }>
      >();
    });

    it("the query should be formed correctly", () => {
      expect(qSelect.query).toMatchInlineSnapshot(`
        "*[_type == \\"variant\\" || _type == \\"product\\" || _type == \\"category\\"] {
            \\"selected\\": select(
            _type == \\"variant\\" => \\"VARIANT\\",
            _type == \\"product\\" => \\"PRODUCT\\",
            \\"OTHER\\"
          )
          }"
      `);
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qSelect, data.datalake);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "selected": "PRODUCT",
          },
          {
            "selected": "PRODUCT",
          },
          {
            "selected": "PRODUCT",
          },
          {
            "selected": "OTHER",
          },
          {
            "selected": "OTHER",
          },
          {
            "selected": "OTHER",
          },
          {
            "selected": "OTHER",
          },
          {
            "selected": "VARIANT",
          },
          {
            "selected": "VARIANT",
          },
        ]
      `);
    });
  });
});
