# groq-builder

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
