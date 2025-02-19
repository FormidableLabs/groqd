---
"groqd": patch
---

Fix: always require `[]` when projecting arrays.

- Prevents issues with chaining `.deref()` and `.field()`
- Makes code clearer
- Reduces noise in auto-complete suggestions
