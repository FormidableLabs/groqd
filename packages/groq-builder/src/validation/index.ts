import { primitives } from "./primitives";
import {
  createGroqBuilder as _createGroqBuilder,
  RootConfig,
  GroqBuilderOptions,
} from "../index";

export * from "../index";

export function createGroqBuilderWithValidation<TRootConfig extends RootConfig>(
  options?: GroqBuilderOptions
) {
  return Object.assign(_createGroqBuilder<TRootConfig>(options), validate);
}

export const validate = {
  ...primitives,
};
