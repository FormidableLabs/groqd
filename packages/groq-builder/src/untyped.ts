import { validate } from "./validation/validate";
import { createGroqBuilder } from "./index";

export const q = Object.assign(createGroqBuilder<any>(), validate);
