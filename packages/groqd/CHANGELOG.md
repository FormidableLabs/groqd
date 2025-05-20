# groqd

## 1.7.1

### Patch Changes

- `filterBy`: support multiple expressions. Expressions will be combined using the `||` "OR" operator. ([#387](https://github.com/FormidableLabs/groqd/pull/387))

## 1.7.0

### Minor Changes

- Fix: simplify Fragments types to eliminate `"Type instantiation is excessively deep and possibly infinite."` errors ([#385](https://github.com/FormidableLabs/groqd/pull/385))

### Patch Changes

- Feature: reduce dependency on Zod to ensure wider compatibility between Zod versions ([#385](https://github.com/FormidableLabs/groqd/pull/385))

## 1.6.0

### Minor Changes

- Feature: ([#381](https://github.com/FormidableLabs/groqd/pull/381))
  - Added support for "not equal" expressions (`!=`).
  - This applies to the `.filterBy` and `.conditional` methods

## 1.5.0

### Minor Changes

- Feature: support "query syntax" in conditionals ([#378](https://github.com/FormidableLabs/groqd/pull/378))
  Feature: support `.value(...)` and `.star` at the subquery level

## 1.4.0

### Minor Changes

- Feature: in filters, support ` != null` syntax, and added support for comparisons between nullish values ([#376](https://github.com/FormidableLabs/groqd/pull/376))

  Feature: in projections, support `^` parent selector, and `@` self selector. For example:

  ```ts
  q.star.filterByType("product").project((sub) => ({
    _type: "_type",
    styles: sub
      .field("styles[]")
      .deref()
      .project((style) => ({
        // Shorthand syntax:
        styleName: "name",
        productName: "^.name", // 👈 here we're selecting the parent name
        styleObject: "@", // 👈 self-selector refers to the entire current object

        // 👇 These selectors are also available via `q.field()` syntax:
        productName: q.field("^.name"),
        styleObject: q.field("@"),
      })),
  }));
  ```

## 1.3.1

### Patch Changes

- Fix: ensure we can get fields from `block` and `reference` objects ([#373](https://github.com/FormidableLabs/groqd/pull/373))

## 1.3.0

### Minor Changes

- Feature: added `.asCombined()` utility, which allows projections from multiple types at once ([#366](https://github.com/FormidableLabs/groqd/pull/366))

### Patch Changes

- Feature: added "passthrough" parameter for `raw` ([#362](https://github.com/FormidableLabs/groqd/pull/362))

- Improvement: updated all examples to prefer using `zod` directly, like `z.string()` ([#366](https://github.com/FormidableLabs/groqd/pull/366))
  Improvement: export zod as `z`

- Improvement: improved fragment types seen in IDEs ([#365](https://github.com/FormidableLabs/groqd/pull/365))

  Chore: ensure we explicitly export types, rather than `export *`, to limit "noise"

## 1.2.0

### Minor Changes

- Feature: added `count` method ([#354](https://github.com/FormidableLabs/groqd/pull/354))

  Feature: added `coalesce` method

### Patch Changes

- Fix: always require `[]` when projecting arrays. ([#358](https://github.com/FormidableLabs/groqd/pull/358))

  - Prevents issues with chaining `.deref()` and `.field()`
  - Makes code clearer
  - Reduces noise in auto-complete suggestions

## 1.1.0

### Minor Changes

- Feature: Simplified APIs ([#351](https://github.com/FormidableLabs/groqd/pull/351))

  We removed irrelevant methods from the root `q` object, and from query chains.
  This improves auto-complete and API discoverability, and reduces confusion.

  - The root `q` object no longer exposes irrelevant chaining methods.
    - E.g. we removed: `q.filter(...)`, `q.deref()`, `q.field(...)`, etc.
  - Query chains no longer expose irrelevant top-level utilities.
    - E.g. we removed `(chain).star`, `(chain).conditional(...)`, `(chain).select(...)`, `(chain).value(...)`, etc.
  - The subquery in a projection no longer exposes irrelevant chaining methods.
    - E.g. with `.project(sub => ({ ... }))` we removed: `sub.filter(...)`, `sub.order(...)`, etc.

  > Backwards compatibility: we only removed methods that created invalid GROQ queries,
  > so this change should be backwards compatible.

## 1.0.9

### Patch Changes

- Improves several pipe-able methods, like `.order`, `.score`, and `.filter` ([#347](https://github.com/FormidableLabs/groqd/pull/347))

  - These methods can now come after a projection with validation (eg. `.project(...).score(...).order(...).filter(...)`
  - The `.order` now supports deep selectors. E.g. `.order("slug.current asc")`

## 1.0.8

### Patch Changes

- Improved Projection Paths ([#344](https://github.com/FormidableLabs/groqd/pull/344))
  - This is used by `.filterBy(...)`, `.field(...)`, and `.project(...)`
  - Projection paths now supports deeper selectors, like `"images[].hotspot.x"`
  - Projection paths now supports optional fields, like `"image.asset"`
  - Projection paths has proper return types for these types, eg. `"images[].hotspot.x": null | Array<null | number>`

## 1.0.7

### Patch Changes

- Added: `score` and `scoreRaw` functions ([#340](https://github.com/FormidableLabs/groqd/pull/340))
  Added: `filterRaw` function
  Deprecated: `filter` function; renamed to `filterRaw` to indicate that it's not type-checked

## 1.0.6

### Patch Changes

- Improves types for `deref` for certain queries ([#335](https://github.com/FormidableLabs/groqd/pull/335))

## 1.0.5

### Patch Changes

- Fixed: `.slice(number)` returns a nullable result ([#331](https://github.com/FormidableLabs/groqd/pull/331))
  Added: `.notNull()` utility
  Updated: `.nullable()` utility to not be chainable
  Updated: require a `redundant: true` parameter for `nullable` and `notNull`
  Added: `InvalidQueryError` is thrown for all invalid queries detected

  Fixes #268

## 1.0.4

### Patch Changes

- Fix: ensure `filter` can be chained after a `deref` ([#329](https://github.com/FormidableLabs/groqd/pull/329))
  Fixes #323

## 1.0.3

### Patch Changes

- Chore: improved error messages for `project` to make them more helpful ([#326](https://github.com/FormidableLabs/groqd/pull/326))

## 1.0.2

### Patch Changes

- Fixed: improve support for ellipsis operator (`...`) when using overrides ([#324](https://github.com/FormidableLabs/groqd/pull/324))
  Fixes #317

## 1.0.1

### Patch Changes

- Added: export `createGroqBuilder` as shortcut for `createGroqBuilderWithZod` ([#314](https://github.com/FormidableLabs/groqd/pull/314))
  Docs: updated sample code

## 1.0.0

### Major Changes

- It's official! GroqD 1.0 is here! ([#310](https://github.com/FormidableLabs/groqd/pull/310))

  This brand-new version of GroqD adds **schema-awareness**, which brings massive improvements to the developer experience!

  This includes:

  - **Auto-completion** - write queries quickly and confidently
  - **Runtime validation** - ensure data integrity, catch errors early
  - **Transformation** - map values at runtime, like parsing dates
  - **Fragments** - create reusable query fragments, and compose queries from other fragments

  This release does include breaking API changes. Please see the [migration docs](https://commerce.nearform.com/open-source/groqd/docs/migration) for more information.

# groq-builder

## 0.10.1

### Patch Changes

- # This package is now deprecated. Use `groqd` instead! ([#305](https://github.com/FormidableLabs/groqd/pull/305))

  Great news! This `groq-builder` codebase has been merged into the official `groqd` project, and is now available as `groqd@1`.

  Please discontinue using `groq-builder` and use `groqd` instead.

## 0.10.0

### Minor Changes

- This is the final release before v1.0 ([#306](https://github.com/FormidableLabs/groqd/pull/306))

  ## Minor changes

  - Configuration: renamed main method from `createGroqBuilder` to `createGroqBuilderLite`
  - Configuration: eliminated need for `ExtractDocumentTypes`
  - Fix: `field` projections handle arrays properly
  - Improvement: better typings for Zod methods

## 0.9.2

### Patch Changes

- Added support for types generated by `sanity typegen` ([#293](https://github.com/FormidableLabs/groqd/pull/293))

## 0.9.1

### Patch Changes

- bump Sanity to 3.15.0. bump vitest to 1.3.1 ([#278](https://github.com/FormidableLabs/groqd/pull/278))

## 0.9.0

### Minor Changes

- Releasing as a Release Candidate ([#266](https://github.com/FormidableLabs/groqd/pull/266))

### Patch Changes

- Fixed a type issue with `project`, where it would complain `argument [] is not assignable to 'never'` ([#266](https://github.com/FormidableLabs/groqd/pull/266))

## 0.5.0

### Minor Changes

- Added support for parameters. ([#263](https://github.com/FormidableLabs/groqd/pull/263))

  Added `filterBy` for strongly-typed filtering.

  Added auto-complete help for conditional statements and filters.

  Changed how parameters are passed to `makeSafeQueryRunner`.

## 0.4.0

### Minor Changes

- Added `createGroqBuilderWithZod()` and removed the `.include(zod)` method ([#257](https://github.com/FormidableLabs/groqd/pull/257))

  Removed internal validation methods; use Zod methods instead

  Added `validationRequired` option to require runtime validation

  Removed `$` from `q.conditional$` and `q.select$` methods; these are now just `q.conditional` and `q.select`

  Added optional validation parameter to `q.field(field, parser?)`

  Cleaned up some internal types, added better type documentation

## 0.3.0

### Minor Changes

- Added `conditional` and `select` features ([#256](https://github.com/FormidableLabs/groqd/pull/256))

- Improved the way we handle validation. ([#255](https://github.com/FormidableLabs/groqd/pull/255))
  Enable "tree shaking" to remove validation, if unused.
  Improve type-checking of validation methods, for better error detection.

### Patch Changes

- Added support for Fragments via `q.fragment` ([#250](https://github.com/FormidableLabs/groqd/pull/250))

## 0.2.0

### Minor Changes

- Added backwards compatibility with GroqD v0.x ([#248](https://github.com/FormidableLabs/groqd/pull/248))
- Implemented validation methods like `q.string()`
- Renamed `grab -> project`, `grabOne -> field`
- Fixed build issues and deployment files

## 0.1.3

### Patch Changes

- Improved build output
- Improved nullable type safety
- Added `makeSafeQueryRunner` utility

## 0.1.1

### Patch Changes

- Implemented core methods ([#239](https://github.com/FormidableLabs/groqd/pull/239))
