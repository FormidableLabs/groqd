import { z } from "zod";

type Query = string;
type Payload<T> = { schema: T; query: Query };

class PipeBase<T> {
  protected query: string;
  protected schema: T;

  constructor({ query, schema }: Payload<T>) {
    this.query = query;
    this.schema = schema;
  }

  public value(): Payload<T> {
    return { schema: this.schema, query: this.query };
  }
}

/**
 * Unknown
 */
class PipeUnknown extends PipeBase<z.ZodUnknown> {
  constructor(payload: Payload<z.ZodUnknown>) {
    super(payload);
  }

  // filter to an unknown array
  filter(filterValue: string): PipeArray<z.ZodArray<z.ZodUnknown>> {
    this.query += `[${filterValue}]`;
    return new PipeArray({ ...this.value(), schema: z.array(z.unknown()) });
  }

  // TODO:
  grab(): PipeSingleEntity<unknown> {
    return this;
  }

  // TODO:
  deref() {
    this.query += "->";
    return this;
  }
}

/**
 * Array
 */
class PipeArray<T extends z.ZodArray<any>> extends PipeBase<T> {
  constructor(payload: Payload<T>) {
    super(payload);
  }

  filter(filterValue: string) {
    this.query += `[${filterValue}]`;
    return this;
  }

  // TODO:
  grab() {
    return this;
  }

  // TODO:
  grabOne() {
    return this;
  }

  order(...orderings: `${string} ${"asc" | "desc"}`[]): PipeArray<T> {
    this.query += `|order(${orderings.join(", ")})`;
    return this;
  }

  slice<Max extends number | undefined>(
    min: number,
    max?: Max
  ): undefined extends Max ? PipeSingleEntity<T> : PipeArray<T> {
    this.query += `[${min}${typeof max === "number" ? `..${max}` : ""}]`;

    if (typeof max === "undefined") {
      this.schema = this.schema.element;
    }

    return this;
  }

  // TODO: Only allow this on unknown arrays?
  deref() {
    this.query += "->";
    return this;
  }
}

/**
 * Single Entity
 */
class PipeSingleEntity<T> extends PipeBase<T> {}

export const pipe = (filter: string): PipeUnknown => {
  return new PipeUnknown({ query: filter, schema: z.unknown() });
};
