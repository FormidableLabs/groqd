---
"groqd": patch
---

Fixed: `.slice(number)` returns a nullable result
Added: `.notNull()` utility
Updated: `.nullable()` utility to not be chainable 
Updated: require a `redundant: true` parameter for `nullable` and `notNull`
Added: `InvalidQueryError` is thrown for all invalid queries detected

Fixes #268
