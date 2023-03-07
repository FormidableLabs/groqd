import { describe, expect, expectTypeOf, it } from "vitest";
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

    expectTypeOf(data).toEqualTypeOf<
      {
        name: string;
        cover: {
          readonly _key: string | null;
          readonly _type: string;
          asset: { _type: "reference"; _ref: string };
        };
      }[]
    >();
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
    expectTypeOf(crop).toEqualTypeOf<{
      top: number;
      bottom: number;
      left: number;
      right: number;
    }>();

    expect(crop.top).toBe(0.028131868131868132);
    expect(crop.bottom).toBe(0.15003663003663004);
    expect(crop.left).toBe(0.01875);
    expect(crop.right).toBe(0.009375000000000022);

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

    expectTypeOf(hotspot).toEqualTypeOf<{
      x: number;
      y: number;
      height: number;
      width: number;
    }>();
    expect(hotspot.x).toBe(0.812500000000001);
    expect(hotspot.y).toBe(0.27963369963369955);
    expect(hotspot.height).toBe(0.3248351648351647);
    expect(hotspot.width).toBe(0.28124999999999994);

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
    expectTypeOf(data[0].cover).toEqualTypeOf<{
      readonly _key: string | null;
      readonly _type: string;
      asset: { _type: "reference"; _ref: string };
      description: string;
    }>();
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
        .slice(1, 1)
        .grab({
          name: q.string(),
          cover: q.sanityImage("cover", {
            withAsset: ["dimensions"],
          }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][1..1]{name, "cover": cover{_key, _type, "asset": asset->{"metadata": metadata{dimensions}}}}`
    );
    const dimensions = data?.[0]?.cover?.asset?.metadata?.dimensions;
    invariant(dimensions);

    expectTypeOf(dimensions).toEqualTypeOf<{
      _type?: "sanity.imageDimensions" | undefined;
      aspectRatio: number;
      height: number;
      width: number;
    }>();

    expect(dimensions._type).toBe("sanity.imageDimensions");
    expect(dimensions.aspectRatio).toBe(2);
    expect(dimensions.height).toBe(500);
    expect(dimensions.width).toBe(1000);
  });

  it("can query fetch image asset data with dimensions metadata WITHOUT `_type`", async () => {
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

    expectTypeOf(dimensions).toEqualTypeOf<{
      _type?: "sanity.imageDimensions" | undefined;
      aspectRatio: number;
      height: number;
      width: number;
    }>();

    expect(dimensions._type).toBeUndefined();
    expect(dimensions.aspectRatio).toBe(2);
    expect(dimensions.height).toBe(500);
    expect(dimensions.width).toBe(1000);
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
    expectTypeOf(location).toEqualTypeOf<{
      _type: "geopoint";
      lat: number;
      lng: number;
    }>();
    expect(location._type).toBe("geopoint");
    expect(location.lat).toBe(59.92399340000001);
    expect(location.lng).toBe(10.758972200000017);
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
    expectTypeOf(lqip).toEqualTypeOf<string>();
    expect(lqip).toBe(
      "data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKABQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABwAE/8QAJBAAAQMDBAEFAAAAAAAAAAAAAQACAwQFEQYHEiEUIjEzQUL/xAAXAQADAQAAAAAAAAAAAAAAAAABAgME/8QAHREAAQMFAQAAAAAAAAAAAAAAAQACAwQREhNRMf/aAAwDAQACEQMRAD8AHNur+NN6ip7jH0xrsFmeiEo7raxivt7pKaJxc2aBuOP5J90H6eaHV9CCARn7STdGN82I8W5DRjpUEWTSbrMagxuxt6sstqt0LuHjMlIHqfI45JUtNR8pUk0DqBqXcX//2Q=="
    );
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
    type Variant = {
      _type: "sanity.imagePaletteSwatch";
      background?: string | null | undefined;
      foreground?: string | null | undefined;
      population?: number | null | undefined;
      title?: string | null | undefined;
    };
    expectTypeOf(darkMuted).toEqualTypeOf<Variant>();
    expect(darkMuted._type === "sanity.imagePaletteSwatch").toBeTruthy();
    expect(darkMuted.background === "#2e5663").toBeTruthy();
    expect(darkMuted.foreground === "#fff").toBeTruthy();
    expect(darkMuted.population === 3.02).toBeTruthy();
    expect(darkMuted.title === "#fff").toBeTruthy();

    expectTypeOf(palette.darkVibrant).exclude(null).toEqualTypeOf<Variant>();
    expect(palette.darkVibrant).toBeTruthy();
    expectTypeOf(palette.dominant).exclude(null).toEqualTypeOf<Variant>();
    expect(palette.dominant).toBeTruthy();
    expectTypeOf(palette.lightMuted).exclude(null).toEqualTypeOf<Variant>();
    expect(palette.lightMuted).toBeTruthy();
    expectTypeOf(palette.lightVibrant).exclude(null).toEqualTypeOf<Variant>();
    expect(palette.lightVibrant).toBeTruthy();
    expectTypeOf(palette.muted).exclude(null).toEqualTypeOf<Variant>();
    expect(palette.muted).toBeTruthy();
    expectTypeOf(palette.vibrant).exclude(null).toEqualTypeOf<Variant>();
    expect(palette.vibrant).toBeTruthy();
  });

  it("can fetch image data with isOpaque, hasAlpha, and blurHash metadata", async () => {
    const { query, data } = await runPokemonQuery(
      q("*")
        .filter("_type == 'pokemon'")
        .slice(0, 1)
        .grab({
          name: q.string(),
          cover: q.sanityImage("cover", {
            withAsset: ["hasAlpha", "isOpaque", "blurHash"],
          }),
        })
    );

    expect(query).toBe(
      `*[_type == 'pokemon'][0..1]{name, "cover": cover{_key, _type, "asset": asset->{"metadata": metadata{isOpaque, hasAlpha, blurHash}}}}`
    );
    invariant(data);
    const metadata = data[0].cover.asset.metadata;
    expectTypeOf(metadata).toEqualTypeOf<{
      isOpaque: boolean | null;
      hasAlpha: boolean | null;
      blurHash: string | null;
    }>();
    expect(metadata.isOpaque).toBe(true);
    expect(metadata.hasAlpha).toBe(false);
    expect(metadata.blurHash).toBe("MLCi~.M|00Dj?v~VtR4.IV%Mo~t6M{aeSO");
  });
});
