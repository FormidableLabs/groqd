import { describe, it, expectTypeOf } from "vitest";
import {
  ProjectionPathEntries,
  ProjectionPaths,
  ProjectionPathValue,
  TypesAreCompatible,
} from "./projection-paths";
import { SanitySchema } from "../tests/schemas/nextjs-sanity-fe";
import { Slug } from "../tests/schemas/nextjs-sanity-fe.sanity-typegen";
import { UndefinedToNull } from "./utils";

type TestObject = {
  a: "A";
  b: { c: "C" };
  d: { e: { f: 0 } };
  g: Array<{ h: Array<{ i: "I" }> }>;
};

describe("ProjectionPaths", () => {
  it("primitive types should not be traversed", () => {
    expectTypeOf<ProjectionPaths<string>>().toEqualTypeOf<never>();
    expectTypeOf<ProjectionPaths<number>>().toEqualTypeOf<never>();
    expectTypeOf<ProjectionPaths<boolean>>().toEqualTypeOf<never>();
    expectTypeOf<ProjectionPaths<symbol>>().toEqualTypeOf<never>();
    expectTypeOf<ProjectionPaths<any>>().toEqualTypeOf<string>();
  });

  it("should generate shallow paths for simple types", () => {
    expectTypeOf<ProjectionPaths<{ a: "A" }>>().toEqualTypeOf<"a">();
    expectTypeOf<ProjectionPaths<{ a: null }>>().toEqualTypeOf<"a">();
    expectTypeOf<ProjectionPaths<{ a: string }>>().toEqualTypeOf<"a">();
    expectTypeOf<ProjectionPaths<{ a: number }>>().toEqualTypeOf<"a">();
    expectTypeOf<ProjectionPaths<{ a: any }>>().toEqualTypeOf<"a">();
  });

  it("should generate keys for deep objects", () => {
    expectTypeOf<ProjectionPaths<{ a: { b: "B" } }>>().toEqualTypeOf<
      "a" | "a.b"
    >();

    expectTypeOf<ProjectionPaths<{ a: { b: { c: "C" } } }>>().toEqualTypeOf<
      "a" | "a.b" | "a.b.c"
    >();
  });

  it("should generate keys for array types", () => {
    expectTypeOf<ProjectionPaths<{ a: [] }>>().toEqualTypeOf<"a" | "a[]">();
    expectTypeOf<ProjectionPaths<{ a: Array<{ b: "B" }> }>>().toEqualTypeOf<
      "a" | "a[]" | "a[].b"
    >();
    expectTypeOf<
      ProjectionPaths<{ a: Array<{ b: Array<{ c: "C" }> }> }>
    >().toEqualTypeOf<
      | "a"
      ///
      | "a[]"
      | "a[].b"
      | "a[].b[]"
      | "a[].b[].c"
    >();
    expectTypeOf<
      ProjectionPaths<{ a: Array<Array<{ b: "B" }>> }>
    >().toEqualTypeOf<
      | "a"
      ///
      | "a[]"
      | "a[][].b"
      | "a[][]"
    >();
  });

  it("works for the <any> type", () => {
    expectTypeOf<ProjectionPaths<any>>().toEqualTypeOf<string>();
  });
});
describe("ProjectionPathValue", () => {
  it("should not allow invalid keys", () => {
    type _INVALID = ProjectionPathValue<
      TestObject,
      // @ts-expect-error ---
      "INVALID"
    >;
  });
  it("should return the correct type for simple paths", () => {
    expectTypeOf<ProjectionPathValue<TestObject, "a">>().toEqualTypeOf<"A">();
    expectTypeOf<ProjectionPathValue<TestObject, "b">>().toEqualTypeOf<{
      c: "C";
    }>();
  });

  it("should return the correct type from deep paths", () => {
    expectTypeOf<ProjectionPathValue<TestObject, "b.c">>().toEqualTypeOf<"C">();
    expectTypeOf<ProjectionPathValue<TestObject, "d.e.f">>().toEqualTypeOf<0>();
  });

  it("should return the correct types from array paths", () => {
    expectTypeOf<ProjectionPathValue<TestObject, "g">>().toEqualTypeOf<
      Array<{ h: Array<{ i: "I" }> }>
    >();
    expectTypeOf<ProjectionPathValue<TestObject, "g[]">>().toEqualTypeOf<
      Array<{ h: Array<{ i: "I" }> }>
    >();
    expectTypeOf<ProjectionPathValue<TestObject, "g[].h">>().toEqualTypeOf<
      Array<Array<{ i: "I" }>>
    >();
    expectTypeOf<ProjectionPathValue<TestObject, "g[].h[]">>().toEqualTypeOf<
      Array<Array<{ i: "I" }>>
    >();
    expectTypeOf<ProjectionPathValue<TestObject, "g[].h[].i">>().toEqualTypeOf<
      Array<Array<"I">>
    >();
  });

  it("works for the <any> type", () => {
    expectTypeOf<ProjectionPathValue<any, "WHATEVER">>().toEqualTypeOf<any>();
  });
});

describe("ProjectionPathEntries", () => {
  it("simple types", () => {
    expectTypeOf<
      ProjectionPathEntries<{
        a: "A";
      }>
    >().toEqualTypeOf<{
      a: "A";
    }>();

    expectTypeOf<
      ProjectionPathEntries<{
        a: 0;
      }>
    >().toEqualTypeOf<{
      a: 0;
    }>();

    expectTypeOf<
      ProjectionPathEntries<{
        a: undefined;
      }>
    >().toEqualTypeOf<{
      a: null;
    }>();

    expectTypeOf<
      ProjectionPathEntries<{
        a: null;
      }>
    >().toEqualTypeOf<{
      a: null;
    }>();

    expectTypeOf<
      ProjectionPathEntries<{
        a: any;
      }>
    >().toEqualTypeOf<{
      a: any;
    }>();

    expectTypeOf<
      ProjectionPathEntries<{
        a: never;
      }>
    >().toEqualTypeOf<{
      a: never;
    }>();
  });
  it("nested objects get flattened", () => {
    expectTypeOf<
      ProjectionPathEntries<{
        a: "A";
        b: { c: "C" };
      }>
    >().toEqualTypeOf<{
      a: "A";
      b: { c: "C" };
      "b.c": "C";
    }>();

    expectTypeOf<
      ProjectionPathEntries<{
        a: { b: { c: "D" } };
      }>
    >().toEqualTypeOf<{
      a: { b: { c: "D" } };
      "a.b": { c: "D" };
      "a.b.c": "D";
    }>();
  });
  it("arrays get square braces", () => {
    expectTypeOf<
      ProjectionPathEntries<{
        a: Array<string>;
      }>
    >().toEqualTypeOf<{
      a: Array<string>;
      "a[]": Array<string>;
    }>();

    expectTypeOf<
      ProjectionPathEntries<{
        a: Array<{ foo: "FOO" }>;
      }>
    >().toEqualTypeOf<{
      a: Array<{ foo: "FOO" }>;
      "a[]": Array<{ foo: "FOO" }>;
      "a[].foo": Array<"FOO">;
    }>();
  });
  it("optional fields work just fine", () => {
    expectTypeOf<ProjectionPathEntries<{ a?: "A" }>>().toEqualTypeOf<{
      a: "A" | null;
    }>();

    expectTypeOf<ProjectionPathEntries<{ a?: { b: "B" } }>>().toEqualTypeOf<{
      a: { b: "B" } | null;
      "a.b": "B" | null;
    }>();

    expectTypeOf<ProjectionPathEntries<{ a?: { b?: "B" } }>>().toEqualTypeOf<{
      a: { b?: "B" } | null;
      "a.b": "B" | null;
    }>();

    expectTypeOf<
      ProjectionPathEntries<{ a: { b?: { c?: "C" } } }>
    >().toEqualTypeOf<{
      a: { b?: { c?: "C" } };
      "a.b": { c?: "C" } | null;
      "a.b.c": "C" | null;
    }>();

    expectTypeOf<
      ProjectionPathEntries<{ a?: { b: { c: "C" } } }>
    >().toEqualTypeOf<{
      a: { b: { c: "C" } } | null;
      "a.b": { c: "C" } | null;
      "a.b.c": "C" | null;
    }>();
  });
  it("works with optional fields and arrays", () => {
    expectTypeOf<
      ProjectionPathEntries<{
        a?: Array<{ b: "B" }>;
      }>
    >().toEqualTypeOf<{
      a: null | Array<{ b: "B" }>;
      "a[]": null | Array<{ b: "B" }>;
      "a[].b": null | Array<"B">;
    }>();
  });
  it("works for the <any> type", () => {
    expectTypeOf<ProjectionPathEntries<any>>().toEqualTypeOf<
      Record<string, any>
    >();
  });

  describe('when working with the "real" Sanity types', () => {
    type V = Required<SanitySchema.Variant>;
    type ProductImage = V["images"][number];
    it('works for "Variant" type', () => {
      type ActualResult = ProjectionPathEntries<SanitySchema.Variant>;

      type ExpectedResult = {
        // These fields stay the same:
        _id: string;
        _type: "variant";
        _createdAt: string;
        _updatedAt: string;
        _rev: string;
        name: string;
        msrp: number;
        price: number;

        // This field is optional, so it gets mapped to `null`:
        id: null | string;

        // This slug gets minimally expanded:
        slug: Slug;
        "slug.current": string;

        // These are references, so they don't go deeper:
        description: null | V["description"];
        "description[]": null | V["description"];
        flavour: null | V["flavour"];
        "flavour[]": null | V["flavour"];
        style: null | V["style"];
        "style[]": null | V["style"];

        // Images get expanded pretty deep:
        images: null | Array<ProductImage>;
        "images[]": null | Array<ProductImage>;
        "images[]._type": null | Array<"productImage">;
        "images[]._key": null | Array<string>;
        "images[].name": null | Array<string>;
        "images[].description": null | Array<null | string>;
        "images[].asset": null | Array<UndefinedToNull<ProductImage["asset"]>>;

        // A deep one:

        "images[].hotspot": null | Array<
          UndefinedToNull<ProductImage["hotspot"]>
        >;
        "images[].hotspot._type": null | Array<null | "sanity.imageHotspot">;
        "images[].hotspot.x": null | Array<null | number>;
        "images[].hotspot.y": null | Array<null | number>;
        "images[].hotspot.height": null | Array<null | number>;
        "images[].hotspot.width": null | Array<null | number>;

        // Another deep one:
        "images[].crop": null | Array<UndefinedToNull<ProductImage["crop"]>>;
        "images[].crop._type": null | Array<null | "sanity.imageCrop">;
        "images[].crop.top": null | Array<null | number>;
        "images[].crop.bottom": null | Array<null | number>;
        "images[].crop.left": null | Array<null | number>;
        "images[].crop.right": null | Array<null | number>;
      };

      expectTypeOf<ActualResult>().toEqualTypeOf<ExpectedResult>();
      expectTypeOf<ExpectedResult>().toEqualTypeOf<ActualResult>();
    });
    it('works for "Image" type', () => {
      expectTypeOf<
        UndefinedToNull<ProductImage["asset"]> extends
          | { _type: "reference" }
          | undefined
          | null
          ? true
          : false
      >().toEqualTypeOf<true>();

      expectTypeOf<
        ProjectionPathEntries<ProductImage["asset"]>
      >().toEqualTypeOf<{}>();
      type ImageEntries = ProjectionPathEntries<ProductImage>;

      expectTypeOf<ImageEntries>().toEqualTypeOf<{
        _type: "productImage";
        _key: string;
        name: string;
        description: null | string;
        asset: UndefinedToNull<ProductImage["asset"]>;

        // A deep one:
        hotspot: UndefinedToNull<ProductImage["hotspot"]>;
        "hotspot._type": null | "sanity.imageHotspot";
        "hotspot.x": null | number;
        "hotspot.y": null | number;
        "hotspot.height": null | number;
        "hotspot.width": null | number;

        // Another deep one:
        crop: UndefinedToNull<ProductImage["crop"]>;
        "crop._type": null | "sanity.imageCrop";
        "crop.top": null | number;
        "crop.bottom": null | number;
        "crop.left": null | number;
        "crop.right": null | number;
      }>();
    });
  });
});
describe("TypesAreCompatible", () => {
  it("should work for literals", () => {
    expectTypeOf<TypesAreCompatible<string, "str">>().toEqualTypeOf<true>();
    expectTypeOf<TypesAreCompatible<"str", string>>().toEqualTypeOf<true>();

    // Should not be compatible:
    expectTypeOf<TypesAreCompatible<"str", "other">>().toEqualTypeOf<false>();
    expectTypeOf<TypesAreCompatible<"str", number>>().toEqualTypeOf<false>();
    expectTypeOf<TypesAreCompatible<number, "str">>().toEqualTypeOf<false>();
  });
});
