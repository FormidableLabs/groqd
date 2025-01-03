import { describe, it, expect, expectTypeOf } from "vitest";
import { q } from "./tests/schemas/nextjs-sanity-fe";
import { makeSafeQueryRunner } from "./makeSafeQueryRunner";

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
      expectTypeOf(options).toEqualTypeOf<
        {
          parameters: {} | undefined;
        } & {
          foo: "FOO";
          bar?: "BAR" | undefined;
        }
      >();
      return null;
    });
  });

  const queryNoParams = q.star.filterByType("variant").project({ name: true });
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
    const result = await runner(queryNoParams);
    expectTypeOf(result).toEqualTypeOf<Array<{ name: string }>>();
    // But for this test, our result echos the query and options:
    expect(result).toMatchInlineSnapshot(`
      [
        "*[_type == "variant"] {
          name
        }",
        {},
      ]
    `);
  });
  it("should not allow parameters if not present", () => {
    async function _onlyCheckTypes() {
      // These are all fine, we allow empty parameters:
      await runner(queryNoParams);
      await runner(queryNoParams, {});
      await runner(queryNoParams, { parameters: {} });

      // @ts-expect-error --- foo does not exist in type EmptyObject
      await runner(queryNoParams, { parameters: { foo: "" } });
    }
  });
  it("should require parameters when present", () => {
    async function _onlyCheckTypes() {
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
    async function _onlyCheckTypes() {
      // @ts-expect-error --- expected 2 arguments
      await runnerWithExtraParams(queryNoParams);
      await runnerWithExtraParams(
        queryNoParams,
        // @ts-expect-error -- property 'extraParameter' is missing
        {}
      );
      await runnerWithExtraParams(queryNoParams, {
        // @ts-expect-error -- null is not assignable to string
        extraParameter: null,
      });

      await runnerWithExtraParams(queryNoParams, {
        extraParameter: "valid",
      });
    }
  });
});
