import { StringKeys } from "./utils";
import { IGroqBuilder } from "../groq-builder";

/**
 * Inside a GROQ query, parameters must be prefixed with $.
 */
export type ParametersWith$Sign<T> = {
  [P in StringKeys<keyof T> as `$${P}`]: T[P];
};
/**
 * Returns the required parameters for the specified query.
 */
export type InferParametersType<TGroqBuilder extends IGroqBuilder<any>> =
  TGroqBuilder extends IGroqBuilder<any, infer TQueryConfig>
    ? TQueryConfig["parameters"]
    : never;
