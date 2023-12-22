import { primitiveValidators } from "./primitives";
import { sanityValidators } from "./sanity-content-blocks";

export const validate = {
  ...primitiveValidators,
  ...sanityValidators,
};
