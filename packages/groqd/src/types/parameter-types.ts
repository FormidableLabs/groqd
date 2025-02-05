import { StringKeys } from "./utils";

/**
 * Inside a GROQ query, parameters must be prefixed with $.
 */
export type ParametersWith$Sign<T> = {
  [P in StringKeys<keyof T> as `$${P}`]: T[P];
};
