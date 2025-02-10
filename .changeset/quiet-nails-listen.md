---
"groqd": patch
---

Improved Projection Paths
- This is used by `.filterBy(...)`, `.field(...)`, and `.project(...)`
- Projection paths now supports deeper selectors, like `"images[].hotspot.x"`
- Projection paths now supports optional fields, like `"image.asset"`
- Projection paths has proper return types for these types, eg. `"images[].hotspot.x": null | Array<null | number>` 
