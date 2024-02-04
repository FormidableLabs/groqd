import { describe, expect, expectTypeOf, it } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { createGroqBuilder, InferVariablesType } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>();

describe("variables", () => {
  const data = mock.generateSeedData({
    variants: [
      mock.variant({ slug: mock.slug({ current: "SLUG-1" }) }),
      mock.variant({ slug: mock.slug({ current: "SLUG-2" }) }),
      mock.variant({ slug: mock.slug({ current: "SLUG-3" }) }),
    ],
  });

  it("the root q object should have no variables", () => {
    expectTypeOf<InferVariablesType<typeof q>>().toEqualTypeOf<unknown>();
  });

  const qWithVariables = q
    .variables<{ slug: string }>()
    .star.filterByType("variant")
    .filter("slug.current == $slug")
    .project({ slug: "slug.current" });

  it("chains should retain the variables type", () => {
    expectTypeOf<InferVariablesType<typeof qWithVariables>>().toEqualTypeOf<{
      slug: string;
    }>();
  });

  it("should require all variables", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function onlyCheckTypes() {
      // @ts-expect-error --- property 'variables' is missing
      await executeBuilder(qWithVariables, {
        datalake: data.datalake,
      });
      await executeBuilder(qWithVariables, {
        datalake: data.datalake,
        // @ts-expect-error --- property 'slug' is missing
        variables: {},
      });
      await executeBuilder(qWithVariables, {
        datalake: data.datalake,
        variables: {
          // @ts-expect-error --- 'invalid' does not exist
          invalid: "",
        },
      });
      await executeBuilder(qWithVariables, {
        datalake: data.datalake,
        variables: {
          // @ts-expect-error --- 'number' is not assignable to 'string'
          slug: 999,
        },
      });
    }
  });

  it("should execute correctly", async () => {
    const results = await executeBuilder(qWithVariables, {
      datalake: data.datalake,
      variables: {
        slug: "SLUG-2",
      },
    });
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "slug": "SLUG-2",
        },
      ]
    `);
  });
});
