import { isZodError } from "../types/zod-like";

export type ErrorDetails = {
  /**
   * The path where the error occurred
   */
  readonly path: PathSegment[]; // Will be appended as errors bubble up
  /**
   * The actual (invalid) value
   */
  readonly value: unknown;
  /**
   * The error message
   */
  readonly message: string;
};

/**
 * An error that represents a list of validation errors
 */
export class ValidationErrors extends TypeError {
  constructor(
    message = "Validation Errors",
    public readonly errors: ErrorDetails[] = []
  ) {
    super(message);
    this.name = "ValidationErrors";
  }

  /**
   * Adds a validation error to the list
   *
   * @param path - Relative path name for this error (e.g. object key, array index)
   * @param value - Actual value at this path
   * @param error - The error - can be a ZodError, another ValidationError, or just any Error object
   */
  public add(path: PathSegment, value: unknown, error: Error) {
    if (isZodError(error)) {
      this.errors.push(
        ...error.errors.map((e) => ({
          path: [path, ...e.path],
          value: value,
          message: e.message,
        }))
      );
    } else if (error instanceof ValidationErrors) {
      const childErrors = error.errors;
      childErrors.forEach((e) => {
        e.path.unshift(path);
      });
      this.errors.push(...childErrors);
    } else {
      this.errors.push({ path: [path], value, message: error.message });
    }
  }

  /**
   * Returns the number of validation errors
   */
  public get length() {
    return this.errors.length;
  }

  /**
   * Returns the error with an updated message.
   * This ensures we don't calculate the message
   * until the error is ready to be thrown.
   * @example
   * if (validationErrors.length) throw validationErrors.withMessage()
   */
  withMessage() {
    const l = this.errors.length;
    const message = `${l} Parsing Error${l === 1 ? "" : "s"}:\n${this.errors
      .map((e) => `${formatPath(["result", ...e.path])}: ${e.message}`)
      .join("\n")}`;
    this.message = message;
    return this;
  }
}

type PathSegment = number | string | null;
function formatPath(paths: PathSegment[]) {
  let res = "";
  for (const p of paths) {
    if (p === null) continue;
    const needsBrace = typeof p === "number" || p === "";
    if (needsBrace) {
      const value = typeof p === "number" ? String(p) : JSON.stringify(p);
      res += "[" + value + "]";
    } else {
      if (!res) res = p;
      else res += "." + p;
    }
  }
  return res;
}
