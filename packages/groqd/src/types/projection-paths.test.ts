import { describe, expectTypeOf, it } from "vitest";
import { SanitySchema } from "../tests/schemas/nextjs-sanity-fe";
import { Slug } from "../tests/schemas/nextjs-sanity-fe.sanity-typegen";
import {
  ProjectionPathEntries,
  ProjectionPathEntriesByType,
  ProjectionPaths,
  ProjectionPathsByType,
  ProjectionPathValue,
} from "./projection-paths";
import { UndefinedToNull } from "./utils";

type TestObject = {
  a: "A";
  b: { c: "C" };
  d: { e: { f: 0; bool: boolean } };
  g: Array<{ h: Array<{ i: "I" }> }>;
  j?: { k: "K" };
};

describe("ProjectionPaths", () => {
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
    expectTypeOf<ProjectionPaths<{ a: unknown[] }>>().toEqualTypeOf<"a[]">();
    expectTypeOf<ProjectionPaths<{ a: Array<{ b: "B" }> }>>().toEqualTypeOf<
      "a[]" | "a[].b"
    >();
    expectTypeOf<
      ProjectionPaths<{ a: Array<{ b: Array<{ c: "C" }> }> }>
    >().toEqualTypeOf<
      | "a[]"
      ///
      | "a[].b[]"
      | "a[].b[].c"
    >();
    expectTypeOf<
      ProjectionPaths<{ a: Array<Array<{ b: "B" }>> }>
    >().toEqualTypeOf<
      | "a[]"
      ///
      | "a[][]"
      | "a[][].b"
    >();
  });

  it("works for the <any> type", () => {
    expectTypeOf<ProjectionPaths<any>>().toEqualTypeOf<string>();
  });
});
describe("ProjectionPathsByType", () => {
  it("should generate paths for matching types", () => {
    expectTypeOf<ProjectionPathsByType<TestObject, string>>().toEqualTypeOf<
      "a" | "b.c"
    >();
    expectTypeOf<
      ProjectionPathsByType<TestObject, number>
    >().toEqualTypeOf<"d.e.f">();
  });
  it("should generate paths matching multiple types", () => {
    type IncludeTypes = string | number;
    expectTypeOf<
      ProjectionPathsByType<TestObject, IncludeTypes>
    >().toEqualTypeOf<"a" | "b.c" | "d.e.f">();
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
    expectTypeOf<ProjectionPathValue<TestObject, "g[]">>().toEqualTypeOf<
      Array<{ h: Array<{ i: "I" }> }>
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
      "a[]": Array<string>;
    }>();

    expectTypeOf<
      ProjectionPathEntries<{
        a: Array<{ foo: "FOO" }>;
      }>
    >().toEqualTypeOf<{
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
      "a[]": null | Array<{ b: "B" }>;
      "a[].b": null | Array<"B">;
    }>();
  });
  it("works for the <any> type", () => {
    expectTypeOf<ProjectionPathEntries<any>>().toEqualTypeOf<
      Record<string, any>
    >();
  });

  describe("built-in types should not be deeply parsed", () => {
    type Block = SanitySchema.Description[number];
    type Reference = NonNullable<SanitySchema.Variant["flavour"]>[number];
    type Example = {
      blocks: Block[];
      ref: Reference;
      optionalRef?: Reference;
      deep: { foo: "bar" };
    };
    it("should not show deep results for built-in types", () => {
      expectTypeOf<ProjectionPathEntries<Example>>().toEqualTypeOf<{
        "blocks[]": Block[];
        ref: Reference;
        optionalRef: Reference | null;
        deep: Example["deep"];
        "deep.foo": "bar";
      }>();
    });
    describe("when at the top level", () => {
      it("should show deep results for a 'block'", () => {
        type Actual = ProjectionPathEntries<Block>;
        type Expected = {
          _type: "block";
          _key: string;
          style: UndefinedToNull<Block["style"]>;
          level: UndefinedToNull<Block["level"]>;
          listItem: UndefinedToNull<Block["listItem"]>;
          "children[]": UndefinedToNull<Block["children"]>;
          "children[]._type": null | Array<"span">;
          "children[]._key": null | Array<string>;
          "children[].text": null | Array<string | null>;
          "children[].marks[]": null | Array<string[] | null>;
          "markDefs[]": UndefinedToNull<Block["markDefs"]>;
          "markDefs[]._type": null | Array<"link">;
          "markDefs[]._key": null | Array<string>;
          "markDefs[].href": null | Array<string | null>;
        };

        expectTypeOf<Actual>().toEqualTypeOf<Expected>();
      });
      it("should show deep results for a 'reference'", () => {
        type Actual = ProjectionPathEntries<Reference>;
        type Expected = {
          _type: "reference";
          _key: string;
          _ref: string;
          _weak: null | boolean;
        };
        expectTypeOf<Actual>().toEqualTypeOf<Expected>();
      });
    });
  });

  describe("when dealing with unions", () => {
    type Union = { _type: "TypeA"; a: "A" } | { _type: "TypeB"; b: "B" };

    it("should only return types for common properties", () => {
      type Actual = ProjectionPathEntries<Union>;
      expectTypeOf<Actual>().toEqualTypeOf<{
        _type: "TypeA" | "TypeB";
      }>();
    });
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
        "description[]": null | V["description"];
        "flavour[]": null | V["flavour"];
        "style[]": null | V["style"];

        // Images get expanded pretty deep:
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
      expectTypeOf<ProjectionPathEntries<ProductImage>>().toEqualTypeOf<{
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
describe("ProjectionPathEntriesByType", () => {
  it("works with optional fields and arrays", () => {
    type Nested = {
      str: string;
      strOpt?: string;
      literalStr: "L";

      num: number;
      numOpt?: number;
      literalNum: 5;

      strNum: string | number;
      bool: boolean;
      true: true;

      deep: {
        str: string;
        numOpt?: number;
        literalStr: "L";
      };
      deepOpt?: {
        str: string;
      };
    };

    expectTypeOf<ProjectionPathEntriesByType<Nested, string>>().toEqualTypeOf<{
      str: string;
      literalStr: "L";
      "deep.str": string;
      "deep.literalStr": "L";
    }>();
  });
});
