export type ErrorDetails = {
  path: string;
  readonly value: unknown;
  readonly error: Error;
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
    if (error instanceof ValidationErrors) {
      error.errors.forEach((e) => {
        e.path = joinPath(path, e.path);
      });
      this.errors.push(...error.errors);
    } else {
      this.errors.push({ path, value, error });
    }
  }

  public get length() {
    return this.errors.length;
  }

  /**
   * Returns a new error with an updated message (since an Error message is read-only)
   */
  withMessage() {
    const l = this.errors.length;
    const message = `${l} Parsing Error${l === 1 ? "" : "s"}:\n${this.errors
      .map((e) => `${joinPath("result", e.path)}: ${e.error.message}`)
      .join("\n")}`;
    return new ValidationErrors(message, this.errors);
  }
}

function joinPath(path1: string, path2: string) {
  const emptyJoin =
    !path1 || !path2 || path1.endsWith("]") || path2.startsWith("[");
  return path1 + (emptyJoin ? "" : ".") + path2;
}
