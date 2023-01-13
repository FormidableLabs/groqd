import { z } from "zod";
import { grab } from "./grab";
import type { Selection } from "./grab";

type Query = string;
type Payload<T> = { schema: T; query: Query };

export class BaseQuery<T> {
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
 * Single Entity
 */
export class EntityQuery<T extends z.ZodTypeAny> extends BaseQuery<T> {
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
    return new EntityQuery<GrabOneType>({
      query: this.query + `.${name}`,
      schema: fieldSchema,
    });
  }
}

/**
 * Unknown, comes out of pipe and is starting point for queries.
 */
export class UnknownQuery extends EntityQuery<z.ZodUnknown> {
  constructor(payload: Payload<z.ZodUnknown>) {
    super(payload);
  }

  // filter to an unknown array
  filter(filterValue = ""): UnknownArrayQuery {
    this.query += `[${filterValue}]`;
    return new UnknownArrayQuery({
      ...this.value(),
      schema: z.array(z.unknown()),
    });
  }
}

/**
 * Array
 */
export class ArrayQuery<T extends z.ZodTypeAny> extends BaseQuery<
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
    return new ArrayQuery<GrabOneType>({
      query: this.query + `.${name}`,
      schema: z.array(fieldSchema),
    });
  }

  order(...orderings: `${string} ${"asc" | "desc"}`[]): ArrayQuery<T> {
    this.query += `|order(${orderings.join(", ")})`;
    return this;
  }

  // Slicing
  slice(index: number): EntityQuery<T>;
  slice(min: number, max: number): ArrayQuery<T>;
  slice(min: number, max?: number): EntityQuery<T> | ArrayQuery<T> {
    this.query += `[${min}${typeof max === "number" ? `..${max}` : ""}]`;

    if (typeof max === "undefined") {
      return new EntityQuery({
        ...this.value(),
        schema: this.schema.element,
      });
    }

    return this;
  }
}

export class UnknownArrayQuery extends ArrayQuery<z.ZodUnknown> {
  constructor(payload: Payload<z.ZodArray<z.ZodUnknown>>) {
    super(payload);
  }

  deref() {
    this.query += "->";
    return this;
  }
}
