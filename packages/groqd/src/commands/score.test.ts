import { InferResultType } from "../index";
import { q, SanitySchema } from "../tests/schemas/nextjs-sanity-fe";
import { describe, expect, expectTypeOf, it } from "vitest";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";

const qVariants = q.star.filterByType("variant");

describe("score", () => {
  const data = mock.generateSeedData({
    variants: [
      mock.variant({ name: "one fish, two fish, red fish, blue fish" }),
      mock.variant({ name: "the rainbow fish" }),
      mock.variant({ name: "other" }),
    ],
  });

  it("score is compiled correctly", () => {
    const qScore = qVariants.score('name match "fish"');
    expect(qScore.query).toMatchInlineSnapshot(
      `"*[_type == "variant"] | score(name match "fish")"`
    );
  });

  it("score is compiled correctly with multiple inputs", () => {
    const qScore = qVariants.score('name match "one"', 'name match "fish"');
    expect(qScore.query).toMatchInlineSnapshot(
      `"*[_type == "variant"] | score(name match "one", name match "fish")"`
    );
  });

  const qScore = qVariants
    .score('name match "fish"')
    .order("_score desc")
    .project({
      name: true,
      _score: true,
    });

  it("should have the correct type", () => {
    expectTypeOf<InferResultType<typeof qScore>>().toEqualTypeOf<
      Array<{
        name: string;
        _score: number;
      }>
    >();
  });

  it("should execute correctly with ordering desc", async () => {
    const results = await executeBuilder(qScore, data);
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "_score": 1.6923076923076923,
          "name": "one fish, two fish, red fish, blue fish",
        },
        {
          "_score": 1,
          "name": "the rainbow fish",
        },
        {
          "_score": 0,
          "name": "other",
        },
      ]
    `);
  });

  it("should execute correctly with ordering asc", async () => {
    const qScoreDesc = qVariants
      .score('name match "fish"')
      .order("_score asc")
      .project({
        name: true,
        _score: true,
      });

    const results = await executeBuilder(qScoreDesc, data);
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "_score": 0,
          "name": "other",
        },
        {
          "_score": 1,
          "name": "the rainbow fish",
        },
        {
          "_score": 1.6923076923076923,
          "name": "one fish, two fish, red fish, blue fish",
        },
      ]
    `);
  });

  it("_score is a field added to the actual items", async () => {
    const qScoreRaw = qVariants.score('name match "fish"').order("_score desc");

    const results = await executeBuilder(qScoreRaw, data);
    const firstResult = results[0];

    expectTypeOf(firstResult).toMatchTypeOf<{ _score: number }>();
    expect(firstResult).toHaveProperty("_score");
  });

  describe("scoreRaw", () => {
    const qScoreRaw = q.star.filterByType("product").scoreRaw("RAW_EXPRESSION");

    it("should allow the raw expression", () => {
      expect(qScoreRaw.query).toMatchInlineSnapshot(
        `"*[_type == "product"] | score(RAW_EXPRESSION)"`
      );
    });

    it("should have the correct type", () => {
      expectTypeOf<InferResultType<typeof qScoreRaw>>().toEqualTypeOf<
        Array<SanitySchema.Product & { _score: number }>
      >();
    });
  });
});
