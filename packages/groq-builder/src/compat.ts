import { validate } from "./validation/validate";
import { createGroqBuilder, makeSafeQueryRunner } from "./index";

export const q = Object.assign(createGroqBuilder<any>(), validate);

export { makeSafeQueryRunner };
