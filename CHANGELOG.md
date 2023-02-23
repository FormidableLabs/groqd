# Changelog

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
