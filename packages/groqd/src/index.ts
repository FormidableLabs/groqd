// Be sure to keep these first 2 imports in this order:
import "./groq-builder";
import "./commands";
import { createGroqBuilderWithZod } from "./createGroqBuilderWithZod";

// Export all public types:

export { ExtractDocumentTypes } from "./types/document-types";
export { InferFragmentType, Fragment } from "./types/fragment-types";
export {
  InferParserInput,
  InferParserOutput,
  Parser,
  ParserFunction,
  ParserObject,
} from "./types/parser-types";
export { InferParametersType } from "./types/parameter-types";
export { QueryConfig } from "./types/query-config";
export { RefType, ExtractRefType } from "./types/ref-types";

export { ValidationErrors, ErrorDetails } from "./validation/validation-errors";

export {
  InferResultItem,
  InferResultType,
  IGroqBuilderNotChainable,
  isGroqBuilder,
  IGroqBuilder,
  GroqBuilderConfigType,
  GroqBuilderResultType,
  GroqBuilderRoot,
  GroqBuilderSubquery,
  RootResult,
  GroqBuilderBase,
  GroqBuilderOptions,
  GroqBuilder,
} from "./groq-builder";
export {
  makeSafeQueryRunner,
  QueryRunnerFunction,
  QueryRunnerOptions,
} from "./makeSafeQueryRunner";
export { createGroqBuilderLite } from "./createGroqBuilder";
export {
  GroqBuilderWithZod,
  createGroqBuilderWithZod,
  z,
  zod,
} from "./createGroqBuilderWithZod";

/**
 * Creates the root `q` query builder.
 *
 * For convenience, includes all Zod validation methods attached to the `q` object, like `q.string()` etc.
 * This ensures an API that's backwards compatible with GroqD v0.x syntax.
 *
 * If you want to use `z` directly,
 * or a different validation library,
 * or don't need runtime validation,
 * use `createGroqBuilderLite` instead.
 *
 * @alias createGroqBuilderWithZod
 *
 * @deprecated
 * Use `createGroqBuilderWithZod(...)` instead.
 * This method will eventually change to an alias for `createGroqBuilderLite`.
 */
export const createGroqBuilder = createGroqBuilderWithZod;
