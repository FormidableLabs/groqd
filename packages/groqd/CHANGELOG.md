# Changelog

## 0.15.8

### Patch Changes

- Always return a new Class from builder methods, addresses #204. ([#211](https://github.com/FormidableLabs/groqd/pull/211))

## 0.15.7

### Patch Changes

- update zod to 3.21.4 ([#201](https://github.com/FormidableLabs/groqd/pull/201))

## 0.15.6

### Patch Changes

- Fix zod version ([#193](https://github.com/FormidableLabs/groqd/pull/193))

## 0.15.5

### Patch Changes

- ability for sanityImage schema to handle file assets ([`85f0621`](https://github.com/FormidableLabs/groqd/commit/85f0621332ec7bd0803d67ad06c974d5bf8607c7))

## 0.15.4

### Patch Changes

- Add rawResponse on GroqdParseError ([#166](https://github.com/FormidableLabs/groqd/pull/166))

## 0.15.3

### Patch Changes

- Move .deref from UnknownQuery to EntityQuery so that one can deref on EntityQuery if need be. ([#160](https://github.com/FormidableLabs/groqd/pull/160))

- Default z.unknown() schema for .grabOne/.grabOne$ methods ([#162](https://github.com/FormidableLabs/groqd/pull/162))

## 0.15.2

### Patch Changes

- Setup NPM provenance ([#156](https://github.com/FormidableLabs/groqd/pull/156))

## 0.15.1

### Patch Changes

- Add .filter() method to EntityQuery ([#149](https://github.com/FormidableLabs/groqd/pull/149))

## 0.15.0

### Minor Changes

- Remove makeContentBlockQuery from exports ([#127](https://github.com/FormidableLabs/groqd/pull/127))

### Patch Changes

- Export BaseQuery class ([#131](https://github.com/FormidableLabs/groqd/pull/131))

## 0.14.0

### Minor Changes

- Deprecate q.sanityImage in favor of standalone sanityImage method, address #109 ([#117](https://github.com/FormidableLabs/groqd/pull/117))

- Loosen \_type field of content block to z.string(), since \_type: "block" isn't necessarily required. Addresses #114. ([#118](https://github.com/FormidableLabs/groqd/pull/118))

### Patch Changes

- Add README back to groqd package ([#113](https://github.com/FormidableLabs/groqd/pull/113))

- Report all errors in makeSafeQueryRunner ([#121](https://github.com/FormidableLabs/groqd/pull/121))

- Expose makeContentBlockQuery function for more flexibility around block content querying. ([#120](https://github.com/FormidableLabs/groqd/pull/120))

## 0.13.1

### Patch Changes

- Moving to monorepo, this is a test release to ensure changesets functionality remains in tact ([#107](https://github.com/FormidableLabs/groqd/pull/107))

## 0.13.0

### Minor Changes

- Add filterByType convenience method ([#102](https://github.com/FormidableLabs/groqd/pull/102))

## 0.12.0

### Minor Changes

- Optional isArray option for q()/pipe() method ([#98](https://github.com/FormidableLabs/groqd/pull/98))

## 0.11.0

### Minor Changes

- Update `makeSafeQueryRunner` to provide more legible error message when parsing fails ([#95](https://github.com/FormidableLabs/groqd/pull/95))

## 0.10.0

### Minor Changes

- - `q.select` schema helper for stronger union types and default conditions ([#82](https://github.com/FormidableLabs/groqd/pull/82)) ([#82](https://github.com/FormidableLabs/groqd/pull/82))
  - `ArrayQuery.select` & `EntityQuery.select` helpers to spread select functions in a block scope ([#82](https://github.com/FormidableLabs/groqd/pull/82))

## 0.9.2

### Patch Changes

- Make `sanityImage` `imageDimensions._type` an optional field ([#86](https://github.com/FormidableLabs/groqd/pull/86))

- Specify custom markdef types in q.contentBlock[s], addresses #61. ([#87](https://github.com/FormidableLabs/groqd/pull/87))

## 0.9.1

### Patch Changes

- Add hasAlpha, isOpaque, and blurHash options to q.sanityImage's withAsset options. ([#84](https://github.com/FormidableLabs/groqd/pull/84))

## 0.9.0

### Minor Changes

- nullToUndefined, grab$, and grabOne$ helpers to make dealing with null return values much more friendly. ([#72](https://github.com/FormidableLabs/groqd/pull/72))

## 0.8.0

### Minor Changes

- added `slug` utility for easier slug access ([#67](https://github.com/FormidableLabs/groqd/pull/67))

### Patch Changes

- added new `contentBlocks` helper for `contentBlock` as list ([#66](https://github.com/FormidableLabs/groqd/pull/66))

- fixed illustrative example in readme docs ([#65](https://github.com/FormidableLabs/groqd/pull/65))

## 0.7.0

### Minor Changes

- Add TypeFromSelection utility type to extract TS type from a selection object ([#63](https://github.com/FormidableLabs/groqd/pull/63))

## 0.6.3

### Patch Changes

- Allow InferType to accept zod schema type ([#54](https://github.com/FormidableLabs/groqd/pull/54))

## 0.6.2

### Patch Changes

- Remove changesets from prod dependencies ([#51](https://github.com/FormidableLabs/groqd/pull/51))

## 0.6.1

### Patch Changes

- Fix q.sanityImage asList -> isList in docs ([#48](https://github.com/FormidableLabs/groqd/pull/48))

## 0.4.0 – 0.6.0

- `q.sanityImage` helper.
- `q.object` schema for Zod objects.
- `q.contentBlock` schema helper for block content.
- `q.score` function.
- Make `makeQueryRunner` more flexible.

## 0.3.2

- Introduce `q.array` for Zod array support.

## 0.3.0

- Refactor to builder pattern.

## 0.0.1 – 0.0.5

- Initial setup of `groqd`, including the `q` pipeline and initial helpers.

## 0.1.0

- `InferType` type utility to better infer type from query result, via [#7](https://github.com/FormidableLabs/groqd/pull/7).
