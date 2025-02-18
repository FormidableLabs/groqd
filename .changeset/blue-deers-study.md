---
"groqd": minor
---

Feature: Simplified APIs

We removed irrelevant methods from the root `q` object, and from query chains.
This improves auto-complete and API discoverability, and reduces confusion.

- The root `q` object no longer exposes irrelevant chaining methods.
  - E.g. we removed: `q.filter(...)`, `q.deref()`, `q.field(...)`, etc.
- Query chains no longer expose irrelevant top-level utilities.
  - E.g. we removed  `(chain).star`, `(chain).conditional(...)`, `(chain).select(...)`, `(chain).value(...)`, etc.
- The subquery in a projection no longer exposes irrelevant chaining methods.
  - E.g. with `.project(sub => ({ ... }))` we removed: `sub.filter(...)`, `sub.order(...)`, etc.
 
> Backwards compatibility: we only removed methods that created invalid GROQ queries,
> so this change should be backwards compatible.
