---
"groq-builder": minor
---

Added `createGroqBuilderWithZod()` and removed the `.include(zod)` method

Removed internal validation methods; use Zod methods instead

Added `validationRequired` option to require runtime validation

Removed `$` from `q.conditional$` and `q.select$` methods; these are now just `q.conditional` and `q.select`

Added optional validation parameter to `q.field(field, parser?)`

Cleaned up some internal types, added better type documentation
