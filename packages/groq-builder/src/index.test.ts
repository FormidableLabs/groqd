import { describe, it, expect, expectTypeOf } from "vitest";
import { SchemaConfig } from "./tests/schemas/nextjs-sanity-fe";
import { createGroqBuilder } from "./createGroqBuilder";
import { makeSafeQueryRunner } from "./makeSafeQueryRunner";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });

describe("makeSafeQueryRunner", () => {
  it("should have correctly-typed parameters", () => {
    makeSafeQueryRunner(async (query, options) => {
      expectTypeOf(query).toEqualTypeOf<string>();
      expectTypeOf(options).toEqualTypeOf<{
        parameters: {} | undefined;
      }>();
      return null;
    });
  });
  it("should have correctly-typed extra parameters", () => {
    makeSafeQueryRunner<{ foo: "FOO"; bar?: "BAR" }>(async (query, options) => {
      expectTypeOf(query).toEqualTypeOf<string>();
      expectTypeOf(options).toEqualTypeOf<{
        parameters: {} | undefined;
        foo: "FOO";
        bar?: "BAR";
      }>();
      return null;
    });
  });

  const query = q.star.filterByType("variant").project({ name: true });
  const queryWithVars = q
    .parameters<{ foo: string }>()
    .star.filterByType("variant")
    .project({ name: true });
  const runner = makeSafeQueryRunner(async (query, options) => {
    return [query, options];
  });
  const runnerWithExtraParams = makeSafeQueryRunner<{ extraParameter: string }>(
    async (query, options) => {
      return [query, options];
    }
  );

  it("should return a runner function", () => {
    expect(runner).toBeTypeOf("function");
  });
  it("the function should be strongly-typed", async () => {
    const result = await runner(query);
    expectTypeOf(result).toEqualTypeOf<Array<{ name: string }>>();
    // But actually, our result contains the query and options:
    expect(result).toMatchInlineSnapshot(`
      [
        "*[_type == \\"variant\\"] {
          name
        }",
        {},
      ]
    `);
  });
  it("should require parameters when present", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function onlyCheckTypes() {
      // @ts-expect-error --- requires 2 parameters
      await runner(queryWithVars);

      await runner(
        queryWithVars,
        // @ts-expect-error --- 'null' is not assignable
        null
      );

      await runner(queryWithVars, {
        // @ts-expect-error --- property 'foo' is missing
        parameters: {},
      });
      await runner(queryWithVars, {
        parameters: {
          // @ts-expect-error --- 'number' is not assignable to 'string'
          foo: 999,
        },
      });
    }
  });

  it("should require extra parameters if defined", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function onlyCheckTypes() {
      // @ts-expect-error --- expected 2 arguments
      await runnerWithExtraParams(query);
      await runnerWithExtraParams(
        query,
        // @ts-expect-error -- property 'extraParameter' is missing
        {}
      );
      await runnerWithExtraParams(query, {
        // @ts-expect-error -- null is not assignable to string
        extraParameter: null,
      });

      await runnerWithExtraParams(query, {
        extraParameter: "valid",
      });
    }
  });
});
