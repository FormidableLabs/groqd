import type { ZodError } from "zod";

export type ErrorDetails = {
  path: string; // Will be overridden as errors bubble up
  readonly value: unknown;
  readonly message: string;
};

export class ValidationErrors extends TypeError {
  constructor(
    message = "Validation Errors",
    protected errors: ErrorDetails[] = []
  ) {
    super(message);
    this.name = "ValidationErrors";
  }

  public add(path: string, value: unknown, error: Error) {
    if (isZodError(error)) {
      this.errors.push(
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
      error.errors.forEach((e) => {
        e.path = joinPath(path, e.path);
      });
      this.errors.push(...error.errors);
    } else {
      this.errors.push({ path, value, message: error.message });
    }
  }

  public get length() {
    return this.errors.length;
  }

  /**
   * Returns the error with an updated message
   */
  withMessage() {
    const l = this.errors.length;
    const message = `${l} Parsing Error${l === 1 ? "" : "s"}:\n${this.errors
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

function isZodError(err: Error): err is ZodError {
  const errZ = err as ZodError;
  return (
    Array.isArray(errZ.errors) &&
    Array.isArray(errZ.issues) &&
    typeof errZ.isEmpty === "boolean"
  );
}
