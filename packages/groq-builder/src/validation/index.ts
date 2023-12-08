import { validate } from "./validate";
import {
  createGroqBuilder as _createGroqBuilder,
  RootConfig,
  GroqBuilderOptions,
} from "../index";

export * from "../index";
export { validate } from "./validate";

export function createGroqBuilderWithValidation<TRootConfig extends RootConfig>(
  options?: GroqBuilderOptions
) {
  return Object.assign(_createGroqBuilder<TRootConfig>(options), validate);
}
