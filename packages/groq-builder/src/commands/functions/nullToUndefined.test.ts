import { describe, it, expect } from "vitest";
import { createGroqBuilder, InferResultType, validation } from "../../index";
import { SchemaConfig } from "../../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../../tests/expectType";
import { nullToUndefined } from "./nullToUndefined";
import { zodValidations } from "../../validation";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " }).include(
  zodValidations
);

describe("nullToUndefined", () => {
  const data = mock.generateSeedData({
    categories: [mock.category({ description: undefined })],
  });
  const qCategory = q.star.filterByType("category").slice(0);

  it("an optional field doesn't work with a Zod default", async () => {
    const qInvalid = qCategory.project({
      description: q.string().optional().default("DEFAULT"),
    });
    // The type is correct:
    expectType<InferResultType<typeof qInvalid>>().toStrictEqual<{
      description: string;
    }>();

    // But it throws runtime errors:
    await expect(() => executeBuilder(qInvalid, data.datalake)).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      "1 Parsing Error:
      result.description: [
        {
          \\"code\\": \\"invalid_type\\",
          \\"expected\\": \\"string\\",
          \\"received\\": \\"null\\",
          \\"path\\": [],
          \\"message\\": \\"Expected string, received null\\"
        }
      ]"
    `);
  });

  const qNullToUndefined = qCategory.project({
    description: nullToUndefined(q.string().optional().default("DEFAULT")),
  });

  it("it works when wrapped with nullToUndefined", async () => {
    expectType<InferResultType<typeof qNullToUndefined>>().toStrictEqual<{
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