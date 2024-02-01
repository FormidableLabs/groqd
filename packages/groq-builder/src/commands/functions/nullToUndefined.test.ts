import { describe, it, expect, expectTypeOf } from "vitest";
import { createGroqBuilderWithZod, InferResultType } from "../../index";
import { SchemaConfig } from "../../tests/schemas/nextjs-sanity-fe";
import { nullToUndefined } from "./nullToUndefined";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";
import { TypeMismatchError } from "../../types/utils";

const q = createGroqBuilderWithZod<SchemaConfig>({ indent: "  " });

describe("nullToUndefined", () => {
  const data = mock.generateSeedData({
    categories: [mock.category({ description: undefined })],
  });
  const qCategory = q.star.filterByType("category").slice(0);

  it("an optional field doesn't work with a Zod default", async () => {
    // @ts-expect-error ---
    const qInvalid = qCategory.project({
      description: q.string().optional().default("DEFAULT"),
    });
    // Expect the description field itself contains details:
    expectTypeOf<InferResultType<typeof qInvalid>>().toEqualTypeOf<{
      description:
        | string
        | TypeMismatchError<{
            error: "⛔️ Parser expects a different input type ⛔️";
            expected: string | undefined;
            actual: null;
          }>;
    }>();
    // And it throws runtime errors:
    await expect(() => executeBuilder(qInvalid, data.datalake)).rejects
      .toThrowErrorMatchingInlineSnapshot(`
        "1 Parsing Error:
        result.description: Expected string, received null"
    `);
  });

  const qNullToUndefined = qCategory.project({
    description: nullToUndefined(q.string().optional().default("DEFAULT")),
  });

  it("it works when wrapped with nullToUndefined", async () => {
    expectTypeOf<InferResultType<typeof qNullToUndefined>>().toEqualTypeOf<{
      description: string;
    }>();

    const results = await executeBuilder(qNullToUndefined, data.datalake);

    expect(results).toMatchInlineSnapshot(`
      {
        "description": "DEFAULT",
      }
    `);
  });
});
