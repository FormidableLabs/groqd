import { primitiveValidators } from "./primitives";
import { createGroqBuilder, RootConfig, GroqBuilderOptions } from "../index";
import { sanityValidators } from "./sanity";

export const validate = {
  ...primitiveValidators,
  ...sanityValidators,
};

export function createGroqBuilderWithValidation<TRootConfig extends RootConfig>(
  options?: GroqBuilderOptions
) {
  return Object.assign(createGroqBuilder<TRootConfig>(options), validate);
}
