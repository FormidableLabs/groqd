import { describe, it, expect, expectTypeOf } from "vitest";
import { q, SanitySchema } from "../../tests/schemas/nextjs-sanity-fe";
import { InferResultItem, InferResultType } from "../../types/public-types";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";

describe("coalesce", () => {
  const data = mock.generateSeedData({});

  describe("as a root-level query", () => {
    describe("should have the correct type", () => {
      it("with literal values", () => {
        const qAB = q.coalesce(q.value("A"), q.value("B"));
        expectTypeOf<InferResultType<typeof qAB>>().toEqualTypeOf<"A" | "B">();

        const qABC = q.coalesce(q.value("A"), q.value("B"), q.value("C"));
        expectTypeOf<InferResultType<typeof qABC>>().toEqualTypeOf<
          "A" | "B" | "C"
        >();

        const qA_B = q.coalesce(q.value("A").nullable(), q.value("B"));
        expectTypeOf<InferResultType<typeof qA_B>>().toEqualTypeOf<"A" | "B">();

        const qA_B_C = q.coalesce(
          q.value("A").nullable(),
          q.value("B").nullable(),
          q.value("C")
        );
        expectTypeOf<InferResultType<typeof qA_B_C>>().toEqualTypeOf<
          "A" | "B" | "C"
        >();

        const qA_B_C_ = q.coalesce(
          q.value("A").nullable(),
          q.value("B").nullable(),
          q.value("C").nullable()
        );
        expectTypeOf<InferResultType<typeof qA_B_C_>>().toEqualTypeOf<
          "A" | "B" | "C" | null
        >();

        const qAB_ = q.coalesce(q.value("A"), q.value("B").nullable());
        expectTypeOf<InferResultType<typeof qAB_>>().toEqualTypeOf<
          "A" | "B" | null
        >();
      });
    });
    it("should execute correctly", async () => {
      // const productCount = await executeBuilder(qProductCount, data);
      // expect(productCount).toEqual(data.products.length);
    });
  });

  describe("in a projection", () => {
    const qVariants = q.star.filterByType("variant");
    it("can use a projection string", () => {
      const qTests = qVariants.project((sub) => ({
        id_name: sub.coalesce("id", "name"),
        name_id: sub.coalesce("name", "id"),
        name_price: sub.coalesce("name", "price"),
        id_price: sub.coalesce("id", "price"),
        name_id_price: sub.coalesce("name", "id", "price"),
      }));
      expectTypeOf<InferResultItem<typeof qTests>>().toEqualTypeOf<{
        id_name: string;
        name_id: string | null;
        name_price: number | string;
        id_price: string | number;
        name_id_price: string | number;
      }>();
    });
    it("can use any nested groq expression", () => {
      const qTests = qVariants.project((sub) => ({
        flavour_style: sub.coalesce(
          sub.field("flavour[]").deref(),
          sub.field("style[]").deref()
        ),
      }));
      expectTypeOf<InferResultItem<typeof qTests>>().toEqualTypeOf<{
        flavour_style:
          | Array<SanitySchema.Flavour>
          | Array<SanitySchema.Style>
          | null;
      }>();
    });

    it("executes correctly", async () => {
      // const results = await executeBuilder(q, data);
      // expect(results).toMatchInlineSnapshot();
    });
  });
});
