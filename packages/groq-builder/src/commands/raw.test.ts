import { describe, it, expect, expectTypeOf } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../types/public-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>();

describe("raw", () => {
  const qVariants = q.star.slice(0, 2);
  const qRaw =
    qVariants.raw<Array<{ ANYTHING: string | null }>>(`{ ANYTHING }`);
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
    const result = await executeBuilder(qRaw, data.datalake);
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
});
