import { describe, expect, it } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";

describe("imageRef", () => {
  it("should be able to query image ref", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          images: q.array(q.imageRef()),
        })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..1]{name, images}`);
    invariant(data);

    expect(data[0].name).toBe("Bulbasaur");
    expect(data[0].images[0]).toEqual({
      _key: "imagekey-1",
      _type: "image",
      asset: {
        _ref: "image-1-jpg",
        _type: "reference",
      },
    });
  });

  it("should be able to query image ref with additional fields", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          images: q.array(
            q.imageRef({
              description: q.string(),
              notThere: q.number().optional(),
            })
          ),
        })
    );

    expect(query).toBe(`*[_type == 'pokemon'][0..1]{name, images}`);
    invariant(data);

    expect(data[0].name).toBe("Bulbasaur");
    expect(data[0].images[0].description).toBe(
      "Bulbasaur has types Grass, Poison."
    );
    expect(data[0].images[0].notThere === undefined).toBeTruthy();
  });
});
