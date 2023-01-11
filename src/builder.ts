import { z } from "zod";
import { doGrab } from "./grabUtil";
import type { Selection } from "./grabUtil";

type Query = string;
type Payload<T> = { schema: T; query: Query };

export class PipeBase<T> {
  query: string;
  schema: T;

  constructor({ query, schema }: Payload<T>) {
    this.query = query;
    this.schema = schema;
  }

  public value(): Payload<T> {
    return { schema: this.schema, query: this.query };
  }
}

/**
 * Unknown, comes out of pipe and is starting point for queries.
 */
export class PipeUnknown extends PipeBase<z.ZodUnknown> {
  constructor(payload: Payload<z.ZodUnknown>) {
    super(payload);
  }

  // filter to an unknown array
  filter(filterValue = ""): PipeArray<z.ZodUnknown> {
    this.query += `[${filterValue}]`;
    return new PipeArray({ ...this.value(), schema: z.array(z.unknown()) });
  }

  grab<
    S extends Selection<z.ZodUnknown>,
    CondSelections extends Record<string, Selection<z.ZodUnknown>> | undefined
  >(selection: S, conditionalSelections?: CondSelections) {
    return doGrab(this.query, this.schema, selection, conditionalSelections);
  }

  grabOne<GrabOneType extends z.ZodType>(
    name: string,
    fieldSchema: GrabOneType
  ) {
    return new PipeSingleEntity<GrabOneType>({
      query: this.query + `.${name}`,
      schema: fieldSchema,
    });
  }
}

/**
 * Array
 */
export class PipeArray<T extends z.ZodTypeAny> extends PipeBase<z.ZodArray<T>> {
  constructor(payload: Payload<z.ZodArray<T>>) {
    super(payload);
  }

  filter(filterValue = "") {
    this.query += `[${filterValue}]`;
    return this;
  }

  grab<
    S extends Selection<T>,
    CondSelections extends Record<string, Selection<T>> | undefined
  >(selection: S, conditionalSelections?: CondSelections) {
    return doGrab(this.query, this.schema, selection, conditionalSelections);
  }

  grabOne<GrabOneType extends z.ZodType>(
    name: string,
    fieldSchema: GrabOneType
  ) {
    return new PipeArray<GrabOneType>({
      query: this.query + `.${name}`,
      schema: z.array(fieldSchema),
    });
  }

  order(...orderings: `${string} ${"asc" | "desc"}`[]): PipeArray<T> {
    this.query += `|order(${orderings.join(", ")})`;
    return this;
  }

  // Slicing
  slice(index: number): PipeSingleEntity<T>;
  slice(min: number, max: number): PipeArray<T>;
  slice(min: number, max?: number): PipeSingleEntity<T> | PipeArray<T> {
    this.query += `[${min}${typeof max === "number" ? `..${max}` : ""}]`;

    if (typeof max === "undefined") {
      return new PipeSingleEntity({
        ...this.value(),
        schema: this.schema.element,
      });
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
export class PipeSingleEntity<T extends z.ZodTypeAny> extends PipeBase<T> {
  constructor(payload: Payload<T>) {
    super(payload);
  }

  grab<
    S extends Selection<T>,
    CondSelections extends Record<string, Selection<T>> | undefined
  >(selection: S, conditionalSelections?: CondSelections) {
    return doGrab(this.query, this.schema, selection, conditionalSelections);
  }

  grabOne<GrabOneType extends z.ZodType>(
    name: string,
    fieldSchema: GrabOneType
  ) {
    return new PipeSingleEntity<GrabOneType>({
      query: this.query + `.${name}`,
      schema: fieldSchema,
    });
  }
}
