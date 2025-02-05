import { createGroqBuilderWithZod } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { describe, expect, it } from "vitest";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";

const q = createGroqBuilderWithZod<SchemaConfig>();

const qVariants = q.star.filterByType("variant");

describe("score", () => {
  const data = mock.generateSeedData({
    variants: mock.array(10, (i) =>
      mock.variant({
        name: i === 5 ? `searched` : `Variant ${i}`,
      })
    ),
  });

  it("score is compiled correctly", () => {
    const qScore = qVariants.score('name match "some name"');
    expect(qScore).toMatchObject({
      query: `*[_type == "variant"] | score(name match "some name")`,
    });
  });

  it("score is compiled correctly with multiple inputs", () => {
    const qScore = qVariants.score('name match "test"', 'name match "hi"');
    expect(qScore).toMatchObject({
      query: `*[_type == "variant"] | score(name match "test", name match "hi")`,
    });
  });

  const scoredDataDesc = [
    data.variants[5],
    ...data.variants.slice(0, 5),
    ...data.variants.slice(6),
  ];

  const scoredDataAsc = [
    ...data.variants.slice(0, 5),
    ...data.variants.slice(6),
    data.variants[5],
  ];

  it("should execute correctly with ordering desc", async () => {
    const qScore = qVariants
      .score('name match "searched"')
      .order("_score desc");
    const results = await executeBuilder(qScore, data);
    expect(results).toMatchObject(scoredDataDesc);
  });

  it("should execute correctly with ordering asc", async () => {
    const qScore = qVariants.score('name match "searched"').order("_score asc");
    const results = await executeBuilder(qScore, data);
    expect(results).toMatchObject(scoredDataAsc);
  });
});
