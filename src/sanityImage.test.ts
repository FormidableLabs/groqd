import { describe, expect, it } from "vitest";
import { runPokemonQuery } from "../test-utils/runQuery";
import { q } from "./index";
import invariant from "tiny-invariant";

describe("sanityImage", () => {
  it("should be able to query image ref with no additional options", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.sanityImage("cover"),
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
          cover: q.sanityImage("cover", { withCrop: true }),
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
          cover: q.sanityImage("cover", { withHotspot: true }),
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
          cover: q.sanityImage("cover", {
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

  it("should be able to query list of sanityImages", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          images: q.sanityImage("images", {
            withCrop: true,
            isList: true,
            additionalFields: {
              description: q.string(),
            },
          }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "images": images[]{_key, _type, "asset": asset{_ref, _type}, "crop": crop{top, bottom, left, right}, description}}`
    );
    const im0 = data?.[0]?.images[0];
    const crop = im0?.crop;
    invariant(data && im0 && crop);
    expect(im0._type === "image").toBeTruthy();
    expect(
      im0.description === "Bulbasaur has types Grass, Poison."
    ).toBeTruthy();
    expect(crop.top === 0.028131868131868132).toBeTruthy();
    expect(crop.bottom === 0.15003663003663004).toBeTruthy();
    expect(crop.left === 0.01875).toBeTruthy();
    expect(crop.right === 0.009375000000000022).toBeTruthy();
  });

  // it("test", async () => {
  //   const { query, data } = await runPokemonQuery(
  //     q("*")
  //       .filter("_type == 'pokemon'")
  //       .slice(0, 1)
  //       .grab({
  //         name: q.string(),
  //         images: q.sanityImage("images", {
  //           isList: true,
  //           withAsset: ["dimensions", "location", "lqip", "palette"],
  //         }),
  //       })
  //   );
  //
  //   invariant(data);
  //   const im = data[0].images[0];
  //   console.log(im);
  // });

  it.only("can query fetch base image asset data", async () => {
    const { query, data, error } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.sanityImage("cover", {
            withAsset: ["base"],
          }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset->{_id, _type, _rev, extension, mimeType, originalFilename, path, sha1hash, size, url, _updatedAt}}}`
    );
    const im = data?.[0]?.cover;
    invariant(im);
    expect(im.asset._id === "image-1-jpg").toBeTruthy();
    expect(im.asset._type === "sanity.imageAsset").toBeTruthy();
    expect(im.asset._rev === "X6HgJNl2Cktkcl6TQwg3gv").toBeTruthy();
    expect(im.asset.extension === "jpg").toBeTruthy();
    expect(im.asset.mimeType === "image/jpeg").toBeTruthy();
    expect(im.asset.originalFilename === "pokemon-1.jpg").toBeTruthy();
    expect(
      im.asset.path ===
        "images/nfttuagc/production/ed158069c3b44124a310d7a107998e06bf12e90e-1000x500.jpg"
    ).toBeTruthy();
    expect(
      im.asset.sha1hash === "ed158069c3b44124a310d7a107998e06bf12e90e"
    ).toBeTruthy();
    expect(im.asset.size === 37594).toBeTruthy();
    expect(
      im.asset.url ===
        "https://cdn.sanity.io/images/nfttuagc/production/ed158069c3b44124a310d7a107998e06bf12e90e-1000x500.jpg"
    ).toBeTruthy();
    expect(im.asset._updatedAt === "2022-12-12T19:45:48Z").toBeTruthy(); // TODO: should be casting to date?
  });

  // TODO: withAsset.dimensions
  // TODO: withAsset.location
  // TODO: withAsset.lqip
  // TODO: withAsset.palette
});
