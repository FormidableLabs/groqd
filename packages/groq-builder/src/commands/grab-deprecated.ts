/*
 * For backwards compatibility, we'll keep `grab` and `grabOne` as deprecated aliases:
 */
import { GroqBuilder } from "../groq-builder";

declare module "../groq-builder" {
  export interface GroqBuilder<TResult, TRootConfig> {
    /**
     * This method has been renamed to 'project' and will be removed in a future version.
     * @deprecated
     * */
    grab: GroqBuilder<TResult, TRootConfig>["project"];
    /**
     * This method has been renamed to 'project' and will be removed in a future version.
     * @deprecated
     * */
    grab$: GroqBuilder<TResult, TRootConfig>["project"];
    /**
     * This method has been renamed to 'projectField' and will be removed in a future version.
     * @deprecated
     * */
    grabOne: GroqBuilder<TResult, TRootConfig>["projectField"];
    /**
     * This method has been renamed to 'projectField' and will be removed in a future version.
     * @deprecated
     * */
    grabOne$: GroqBuilder<TResult, TRootConfig>["projectField"];
  }
}
GroqBuilder.implement({
  grab: deprecated<any>(GroqBuilder.prototype.project, () => {
    console.warn(
      "'grab' has been renamed to 'project' and will be removed in a future version"
    );
  }),
  grab$: deprecated<any>(GroqBuilder.prototype.project, () => {
    console.warn(
      "'grab$' has been renamed to 'project' and will be removed in a future version"
    );
  }),
  grabOne: deprecated<any>(GroqBuilder.prototype.projectField, () => {
    console.warn(
      "'grabOne' has been renamed to 'projectField' and will be removed in a future version"
    );
  }),
  grabOne$: deprecated<any>(GroqBuilder.prototype.projectField, () => {
    console.warn(
      "'grabOne$' has been renamed to 'projectField' and will be removed in a future version"
    );
  }),
});

function deprecated<TMethod extends (...args: any[]) => any>(
  method: TMethod,
  logWarning: () => void
): TMethod {
  let logOnce = logWarning as null | typeof logWarning;
  return function (this: GroqBuilder, ...args) {
    if (logOnce) {
      logOnce();
      logOnce = null;
    }
    return method.apply(this, args);
  } as TMethod;
}
