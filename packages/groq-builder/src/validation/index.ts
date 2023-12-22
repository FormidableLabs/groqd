import { primitiveValidation } from "./primitives";
import { sanityValidation } from "./sanity-content-blocks";

export const validation = {
  ...primitiveValidation,
  ...sanityValidation,
};
