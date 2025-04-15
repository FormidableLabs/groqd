---
"groqd": patch
---

Feature: in projections, support `^` parent selector, and `@` self selector.  For example:

```ts
q.star.filterByType("product").project((sub) => ({
  _type: "_type",
  styles: sub.field("styles[]").deref().project((style) => ({
    // Shorthand syntax:
    styleName: "name",
    productName: "^.name", // 👈 here we're selecting the parent name
    styleObject: "@", // 👈 self-selector refers to the entire current object

    // These selectors are also available via `q.field()` syntax:
    productName: q.field("^.name"),
    styleObject: q.field("@"),
  })),
}));
```
