import { z } from "zod";
import { ValueOf } from "./types";

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
class PipeUnknown extends PipeBase<z.ZodUnknown> {
  constructor(payload: Payload<z.ZodUnknown>) {
    super(payload);
  }

  // filter to an unknown array
  filter(filterValue: string): PipeArray<z.ZodUnknown> {
    this.query += `[${filterValue}]`;
    return new PipeArray({ ...this.value(), schema: z.array(z.unknown()) });
  }

  // TODO: Need to make this abstraction 😬
  // Shouldn't be terrible, just need to do it.
  grab(): PipeSingleEntity<unknown> {
    return this;
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

  deref() {
    this.query += "->";
    return this;
  }
}

/**
 * Array
 */
class PipeArray<T extends z.ZodTypeAny> extends PipeBase<z.ZodArray<T>> {
  constructor(payload: Payload<z.ZodArray<T>>) {
    super(payload);
  }

  filter(filterValue: string) {
    this.query += `[${filterValue}]`;
    return this;
  }

  grab<
    S extends Selection<T>,
    CondSelections extends Record<string, Selection<T>> | undefined
  >(selection: S, conditionalSelections?: CondSelections) {
    type FromSelection<Sel extends Selection<T>> = z.ZodObject<{
      [K in keyof Sel]: Sel[K] extends PipeBase<any>
        ? Sel[K]["schema"]
        : FromField<Sel[K]>;
    }>;
    type AllSelection = undefined extends CondSelections
      ? FromSelection<S>
      : z.ZodUnion<
          [
            ValueOf<{
              [K in keyof CondSelections]: FromSelection<S & CondSelections[K]>;
            }>,
            FromSelection<S>
          ]
        >;

    // Recursively define projections to pick up nested conditionals
    const getProjections = (sel: Selection<T>) =>
      Object.entries(sel).reduce<string[]>((acc, [key, val]) => {
        let toPush = "";
        if (val instanceof PipeBase) {
          toPush = `"${key}": ${val.query}`;
        } else if (Array.isArray(val)) {
          toPush = `"${key}": ${val[0]}`;
        } else {
          toPush = key;
        }

        toPush && acc.push(toPush);
        return acc;
      }, []);
    const projections = getProjections(selection);
    if (conditionalSelections) {
      const condProjections = Object.entries(conditionalSelections).reduce<
        string[]
      >((acc, [key, val]) => {
        acc.push(`${key} => { ${getProjections(val).join(", ")} }`);
        return acc;
      }, []);

      projections.push(`...select(${condProjections.join(", ")})`);
    }

    const schema = (() => {
      const toSchemaInput = (sel: Selection<T>) =>
        Object.entries(sel).reduce<z.ZodRawShape>((acc, [key, value]) => {
          if (value instanceof PipeBase) {
            acc[key] = value.schema;
          } else if (Array.isArray(value)) {
            acc[key] = value[1];
          } else if (value instanceof z.ZodType) {
            acc[key] = value;
          }
          return acc;
        }, {});

      // Unknown schema means we just use the selection passed
      if (this.schema.element instanceof z.ZodUnknown) {
        // Split base and conditional fields
        const conditionalFields = Object.values(
          conditionalSelections || {}
        ) as Selection<T>[];

        const baseSchema = z.object(toSchemaInput(selection));
        const conditionalFieldSchemas = conditionalFields.map((field) =>
          baseSchema.merge(z.object(toSchemaInput(field)))
        );
        const s =
          conditionalFieldSchemas.length === 0
            ? baseSchema
            : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore Need to figure out how to make tsc happy
              z.union([...conditionalFieldSchemas, baseSchema]);

        return z.array(s); // FORK HERE
      }
      // If we're already dealing with an object schema inside our array, we need to do a Pick
      else if (this.schema.element instanceof z.ZodObject) {
        const toPick = Object.keys(selection).reduce<{
          [key: string]: true;
        }>((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});

        return z.array(this.schema.element.pick(toPick)); // FORK HERE
      }
      // If not unknown/object, I don't know what happened 👀
      else {
        return z.array(z.object({}));
      }
    })();

    return new PipeArray({
      query: this.query + `{${projections.join(", ")}}`,
      schema,
    }) as unknown as PipeArray<AllSelection>;
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
class PipeSingleEntity<T> extends PipeBase<T> {
  constructor(payload: Payload<T>) {
    super(payload);
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

export const pipe = (filter: string): PipeUnknown => {
  return new PipeUnknown({ query: filter, schema: z.unknown() });
};

/**
 * Misc util
 */
type Field<T extends z.ZodType> = T;
type FromField<T> = T extends Field<infer R>
  ? R
  : T extends [string, infer R]
  ? R
  : z.ZodNever;

type Selection<Base> = Record<
  Base extends z.ZodUnknown
    ? string
    : Base extends z.ZodObject<infer R>
    ? keyof R
    : never,
  PipeBase<any> | z.ZodType | [string, z.ZodType]
>;
