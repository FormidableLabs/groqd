// Ensure these files are imported first, so we can use their implementations:
import "./project";
import "./projectField";
/*
 * For backwards compatibility, we'll keep `grab` and `grabOne` as deprecated aliases:
 */
import { GroqBuilder, GroqBuilderBase } from "../groq-builder";

declare module "../groq-builder" {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface GroqBuilderBase<TResult, TQueryConfig> {
    /**
     * @deprecated This method has been renamed to 'project' and will be removed in a future version.
     */
    grab: GroqBuilder<TResult, TQueryConfig>["project"];
    /**
     * @deprecated This method has been renamed to 'project' and will be removed in a future version.
     */
    grab$: GroqBuilder<TResult, TQueryConfig>["project"];
    /**
     * @deprecated This method has been renamed to 'field' and will be removed in a future version.
     */
    grabOne: GroqBuilder<TResult, TQueryConfig>["field"];
    /**
     * @deprecated This method has been renamed to 'field' and will be removed in a future version.
     */
    grabOne$: GroqBuilder<TResult, TQueryConfig>["field"];
  }
}
GroqBuilderBase.implement({
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
  grabOne: deprecated<any>(GroqBuilder.prototype.field, () => {
    console.warn(
      "'grabOne' has been renamed to 'field' and will be removed in a future version"
    );
  }),
  grabOne$: deprecated<any>(GroqBuilder.prototype.field, () => {
    console.warn(
      "'grabOne$' has been renamed to 'field' and will be removed in a future version"
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
