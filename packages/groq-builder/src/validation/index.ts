import { primitives } from "./primitives";
import {
  createGroqBuilder as _createGroqBuilder,
  RootConfig,
  GroqBuilderOptions,
} from "../index";
import { sanityValidators } from "./content-block";

export * from "../index";
export { primitives } from "./primitives";
export { sanityValidators } from "./content-block";

export function createGroqBuilderWithValidation<TRootConfig extends RootConfig>(
  options?: GroqBuilderOptions
) {
  return Object.assign(_createGroqBuilder<TRootConfig>(options), validate);
}

export const validate = {
  ...primitives,
  ...sanityValidators,
};
