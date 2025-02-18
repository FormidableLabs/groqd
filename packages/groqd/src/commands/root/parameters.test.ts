import { describe, expect, expectTypeOf, it } from "vitest";
import { q } from "../../tests/schemas/nextjs-sanity-fe";
import { InferParametersType } from "../../index";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";

describe("parameters", () => {
  const data = mock.generateSeedData({
    variants: [
      mock.variant({ slug: mock.slug({ current: "SLUG-1" }) }),
      mock.variant({ slug: mock.slug({ current: "SLUG-2" }) }),
      mock.variant({ slug: mock.slug({ current: "SLUG-3" }) }),
    ],
  });

  it("a plain query should have no parameters", () => {
    expectTypeOf<InferParametersType<typeof q.star>>().toEqualTypeOf<unknown>();
  });

  const qWithParameters = q
    .parameters<{ slug: string }>()
    .star.filterByType("variant")
    .filter("slug.current == $slug")
    .project({ slug: "slug.current" });

  it("chains should retain the parameters type", () => {
    expectTypeOf<InferParametersType<typeof qWithParameters>>().toEqualTypeOf<{
      slug: string;
    }>();
  });

  it("should require all parameters", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function onlyCheckTypes() {
      // @ts-expect-error --- property 'parameters' is missing
      await executeBuilder(qWithParameters, {
        datalake: data.datalake,
      });
      await executeBuilder(qWithParameters, {
        datalake: data.datalake,
        // @ts-expect-error --- property 'slug' is missing
        parameters: {},
      });
      await executeBuilder(qWithParameters, {
        datalake: data.datalake,
        parameters: {
          // @ts-expect-error --- 'invalid' does not exist
          invalid: "",
        },
      });
      await executeBuilder(qWithParameters, {
        datalake: data.datalake,
        parameters: {
          // @ts-expect-error --- 'number' is not assignable to 'string'
          slug: 999,
        },
      });
    }
  });

  it("should execute correctly", async () => {
    const results = await executeBuilder(qWithParameters, {
      datalake: data.datalake,
      parameters: {
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
