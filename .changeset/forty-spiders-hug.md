---
"groq-builder": minor
---

Removed internal validation methods; use Zod methods instead.

Removed `$` from `q.conditional$` and `q.select$` methods; these are now just `q.conditional` and `q.select`

Added optional validation parameter to `q.field(field, validation?)`

Cleaned up some internal types, added better type documentation
