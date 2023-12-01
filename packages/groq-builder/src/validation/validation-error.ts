export class ValidationError extends TypeError {
  constructor(
    public path: string,
    public readonly value: unknown,
    public readonly error: Error
  ) {
    super("Validation Error");
  }
}

export class ValidationErrors extends TypeError {
  constructor(message = "Validation Errors") {
    super(message);
    this.name = "ValidationErrors";
  }
  public errors: ValidationError[] = [];

  public add(path: string, value: unknown, error: Error) {
    if (error instanceof ValidationErrors) {
      error.errors.forEach((e) => {
        e.path = joinPath(path, e.path);
      });
      this.errors.push(...error.errors);
    } else {
      this.errors.push(new ValidationError(path, value, error));
    }
  }
  withMessage(path: string) {
    const l = this.errors.length;
    return new ValidationErrors(
      `${l} Parsing Error${l === 1 ? "" : "s"}:\n${this.errors
        .map((e) => `${joinPath(path, e.path)}: ${e.error.message}`)
        .join("\n")}`
    );
  }
}

function joinPath(path1: string, path2: string) {
  const emptyJoin =
    !path1 || !path2 || path1.endsWith("]") || path2.startsWith("[");
  return path1 + (emptyJoin ? "" : ".") + path2;
}
