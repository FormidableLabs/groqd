import type { ZodError } from "zod";

export type ErrorDetails = {
  /**
   * The path where the error occurred
   */
  path: string; // Will be overridden as errors bubble up
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
    private _errors: ErrorDetails[] = []
  ) {
    super(message);
    this.name = "ValidationErrors";
  }

  /**
   * Adds a validation error to the list
   *
   * @param path - Relative path name for this error (eg. object key, array index)
   * @param value - Actual value at this path
   * @param error - The error - can be a ZodError, another ValidationError, or just any Error object
   */
  public add(path: string, value: unknown, error: Error) {
    if (isZodError(error)) {
      this._errors.push(
        ...error.errors.map((e) => ({
          path: joinPath(
            path,
            ...e.path.map((p) => (typeof p === "number" ? `[${p}]` : p))
          ),
          value: value,
          message: e.message,
        }))
      );
    } else if (error instanceof ValidationErrors) {
      const childErrors = error._errors;
      childErrors.forEach((e) => {
        e.path = joinPath(path, e.path);
      });
      this._errors.push(...childErrors);
    } else {
      this._errors.push({ path, value, message: error.message });
    }
  }

  /**
   * Returns the number of validation errors
   */
  public get length() {
    return this._errors.length;
  }

  /**
   * Returns a list of all validation errors
   */
  public get errors(): ReadonlyArray<ErrorDetails> {
    return this._errors;
  }

  /**
   * Returns the error with an updated message.
   * This ensures we don't calculate the message
   * until the error is ready to be thrown.
   * @example
   * if (validationErrors.length) throw validationErrors.withMessage()
   */
  withMessage() {
    const l = this._errors.length;
    const message = `${l} Parsing Error${l === 1 ? "" : "s"}:\n${this._errors
      .map((e) => `${joinPath("result", e.path)}: ${e.message}`)
      .join("\n")}`;
    this.message = message;
    return this;
  }
}

function joinPath(path1: string, ...paths: string[]) {
  let result = path1;
  for (const p of paths) {
    const needsDot = result && p && !p.startsWith("[");
    if (needsDot) result += ".";
    result += p;
  }
  return result;
}

/**
 * Determines if the error is Zod-like
 */
function isZodError(err: Error): err is ZodError {
  const errZ = err as ZodError;
  return (
    Array.isArray(errZ.errors) &&
    Array.isArray(errZ.issues) &&
    typeof errZ.isEmpty === "boolean"
  );
}
