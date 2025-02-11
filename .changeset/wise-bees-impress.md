---
"groqd": patch
---

Improves several pipe-able methods, like `.order`, `.score`, and `.filter`

- These methods can now come after a projection with validation (eg. `.project(...).score(...).order(...).filter(...)`
- The `.order` now supports deep selectors.  E.g. `.order("slug.current asc")`
