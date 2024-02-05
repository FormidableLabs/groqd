# groq-builder

## 0.4.0

### Minor Changes

- Added `createGroqBuilderWithZod()` and removed the `.include(zod)` method ([#257](https://github.com/FormidableLabs/groqd/pull/257))

  Removed internal validation methods; use Zod methods instead

  Added `validationRequired` option to require runtime validation

  Removed `# groq-builder from `q.conditional# groq-builder and `q.select# groq-builder methods; these are now just `q.conditional`and`q.select`

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
