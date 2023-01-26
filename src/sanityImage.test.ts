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
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset{_ref, _type}, crop}}`
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
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset{_ref, _type}, hotspot}}`
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
      `*[_type == 'pokemon'][0..1]{name, "images": images[]{_key, _type, "asset": asset{_ref, _type}, crop, description}}`
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

  it("can query fetch base image asset data", async () => {
    const { query, data } = await runPokemonQuery(
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
    expect(im.asset._updatedAt === "2022-12-12T19:45:48Z").toBeTruthy();
  });

  it("can query fetch image asset data with dimensions metadata", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.sanityImage("cover", {
            withAsset: ["dimensions"],
          }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset->{"metadata": metadata{dimensions}}}}`
    );
    const dimensions = data?.[0]?.cover?.asset?.metadata?.dimensions;
    invariant(dimensions);
    expect(dimensions._type === "sanity.imageDimensions").toBeTruthy();
    expect(dimensions.aspectRatio === 2).toBeTruthy();
    expect(dimensions.height === 500).toBeTruthy();
    expect(dimensions.width === 1000).toBeTruthy();
  });

  it("can query fetch image asset data with location metadata", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.sanityImage("cover", {
            withAsset: ["location"],
          }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset->{"metadata": metadata{location}}}}`
    );
    const location = data?.[0]?.cover?.asset?.metadata?.location;
    invariant(location);
    expect(location._type === "geopoint").toBeTruthy();
    expect(location.lat === 59.92399340000001).toBeTruthy();
    expect(location.lng === 10.758972200000017).toBeTruthy();
  });

  it("can query fetch image asset data with lqip metadata", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.sanityImage("cover", {
            withAsset: ["lqip"],
          }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset->{"metadata": metadata{lqip}}}}`
    );
    const lqip = data?.[0]?.cover?.asset?.metadata?.lqip;
    invariant(lqip);
    expect(
      lqip ===
        "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKABQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABwAE/8QAJBAAAQMDBAEFAAAAAAAAAAAAAQACAwQFEQYHEiEUIjEzQUL/xAAXAQADAQAAAAAAAAAAAAAAAAABAgME/8QAHREAAQMFAQAAAAAAAAAAAAAAAQACAwQREhNRMf/aAAwDAQACEQMRAD8AHNur+NN6ip7jH0xrsFmeiEo7raxivt7pKaJxc2aBuOP5J90H6eaHV9CCARn7STdGN82I8W5DRjpUEWTSbrMagxuxt6sstqt0LuHjMlIHqfI45JUtNR8pUk0DqBqXcX//2Q=="
    ).toBeTruthy();
  });

  it("can query fetch image asset data with palette metadata", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.sanityImage("cover", {
            withAsset: ["palette"],
          }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset->{"metadata": metadata{palette}}}}`
    );
    const palette = data?.[0]?.cover?.asset?.metadata?.palette;
    invariant(palette);
    const darkMuted = palette.darkMuted;

    invariant(darkMuted);
    expect(darkMuted._type === "sanity.imagePaletteSwatch").toBeTruthy();
    expect(darkMuted.background === "#2e5663").toBeTruthy();
    expect(darkMuted.foreground === "#fff").toBeTruthy();
    expect(darkMuted.population === 3.02).toBeTruthy();
    expect(darkMuted.title === "#fff").toBeTruthy();

    expect(palette.darkVibrant).toBeTruthy();
    expect(palette.dominant).toBeTruthy();
    expect(palette.lightMuted).toBeTruthy();
    expect(palette.lightVibrant).toBeTruthy();
    expect(palette.muted).toBeTruthy();
    expect(palette.vibrant).toBeTruthy();
  });
});
