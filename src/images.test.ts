import { describe, expect, it } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";

describe("imageRef", () => {
  it("should be able to query image ref with no additional options", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.imageRef("cover"),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset{_ref, _type}}}`
    );
    invariant(data);

    expect(data[0].name).toBe("Bulbasaur");
    const cover = data[0].cover;
    expect(cover._type === "image").toBeTruthy();
    expect(cover.asset._type === "reference").toBeTruthy();
  });

  it("should be able to query image ref with crop", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.imageRef("cover", { withCrop: true }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset{_ref, _type}, "crop": crop{top, bottom, left, right}}}`
    );
    const crop = data?.[0].cover.crop;
    invariant(data && crop);
    expect(crop.top === 0.028131868131868132).toBeTruthy();
    expect(crop.bottom === 0.15003663003663004).toBeTruthy();
    expect(crop.left === 0.01875).toBeTruthy();
    expect(crop.right === 0.009375000000000022).toBeTruthy();

    // @ts-expect-error we didn't specify withHotspot so we shouldn't expect it in result
    expect(data[0].cover.hotspot).toBeUndefined();
  });

  it("should be able to query image ref with hotspot", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.imageRef("cover", { withHotspot: true }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset{_ref, _type}, "hotspot": hotspot{x, y, height, width}}}`
    );
    const hotspot = data?.[0].cover.hotspot;
    invariant(data && hotspot);

    expect(hotspot.x === 0.812500000000001).toBeTruthy();
    expect(hotspot.y === 0.27963369963369955).toBeTruthy();
    expect(hotspot.height === 0.3248351648351647).toBeTruthy();
    expect(hotspot.width === 0.28124999999999994).toBeTruthy();

    // @ts-expect-error we didn't specify withCrop so we shouldn't expect it in result
    expect(data[0].cover.crop).toBeUndefined();
  });

  it("should be able to query image ref with additional fields", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.imageRef("cover", {
            additionalFields: {
              description: q.string(),
            },
          }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset{_ref, _type}, description}}`
    );
    invariant(data);
    expect(
      data[0].cover.description === "Bulbasaur has types Grass, Poison."
    ).toBeTruthy();
  });
});
