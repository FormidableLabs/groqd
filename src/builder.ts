import { z } from "zod";
import { grab } from "./grab";
import type { Selection } from "./grab";

type Query = string;
type Payload<T> = { schema: T; query: Query };

export class BaseResult<T> {
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
export class UnknownResult extends BaseResult<z.ZodUnknown> {
  constructor(payload: Payload<z.ZodUnknown>) {
    super(payload);
  }

  // filter to an unknown array
  filter(filterValue = ""): UnknownArrayResult {
    this.query += `[${filterValue}]`;
    return new UnknownArrayResult({
      ...this.value(),
      schema: z.array(z.unknown()),
    });
  }

  grab<
    S extends Selection,
    CondSelections extends Record<string, Selection> | undefined
  >(selection: S, conditionalSelections?: CondSelections) {
    return grab(this.query, this.schema, selection, conditionalSelections);
  }

  grabOne<GrabOneType extends z.ZodType>(
    name: string,
    fieldSchema: GrabOneType
  ) {
    return new EntityResult<GrabOneType>({
      query: this.query + `.${name}`,
      schema: fieldSchema,
    });
  }
}

/**
 * Array
 */
export class ArrayResult<T extends z.ZodTypeAny> extends BaseResult<
  z.ZodArray<T>
> {
  constructor(payload: Payload<z.ZodArray<T>>) {
    super(payload);
  }

  filter(filterValue = "") {
    this.query += `[${filterValue}]`;
    return this;
  }

  grab<
    S extends Selection,
    CondSelections extends Record<string, Selection> | undefined
  >(selection: S, conditionalSelections?: CondSelections) {
    return grab(this.query, this.schema, selection, conditionalSelections);
  }

  grabOne<GrabOneType extends z.ZodType>(
    name: string,
    fieldSchema: GrabOneType
  ) {
    return new ArrayResult<GrabOneType>({
      query: this.query + `.${name}`,
      schema: z.array(fieldSchema),
    });
  }

  order(...orderings: `${string} ${"asc" | "desc"}`[]): ArrayResult<T> {
    this.query += `|order(${orderings.join(", ")})`;
    return this;
  }

  // Slicing
  slice(index: number): EntityResult<T>;
  slice(min: number, max: number): ArrayResult<T>;
  slice(min: number, max?: number): EntityResult<T> | ArrayResult<T> {
    this.query += `[${min}${typeof max === "number" ? `..${max}` : ""}]`;

    if (typeof max === "undefined") {
      return new EntityResult({
        ...this.value(),
        schema: this.schema.element,
      });
    }

    return this;
  }
}

export class UnknownArrayResult extends ArrayResult<z.ZodUnknown> {
  constructor(payload: Payload<z.ZodArray<z.ZodUnknown>>) {
    super(payload);
  }

  deref() {
    this.query += "->";
    return this;
  }
}

/**
 * Single Entity
 */
export class EntityResult<T extends z.ZodTypeAny> extends BaseResult<T> {
  constructor(payload: Payload<T>) {
    super(payload);
  }

  grab<
    S extends Selection,
    CondSelections extends Record<string, Selection> | undefined
  >(selection: S, conditionalSelections?: CondSelections) {
    return grab(this.query, this.schema, selection, conditionalSelections);
  }

  grabOne<GrabOneType extends z.ZodType>(
    name: string,
    fieldSchema: GrabOneType
  ) {
    return new EntityResult<GrabOneType>({
      query: this.query + `.${name}`,
      schema: fieldSchema,
    });
  }
}
