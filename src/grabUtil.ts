import { z } from "zod";
import { ValueOf } from "./types";
import { PipeArray, PipeBase, PipeSingleEntity } from "./builder";

export const doGrab = <
  T extends z.ZodTypeAny | z.ZodArray<any>,
  S extends Selection<T>,
  CondSelections extends Record<string, Selection<T>> | undefined
>(
  query: string,
  schema: T,
  selection: S,
  conditionalSelections?: CondSelections
) => {
  type FromSelection<Sel extends Selection<T>> = z.ZodObject<{
    [K in keyof Sel]: Sel[K] extends PipeBase<any>
      ? Sel[K]["schema"]
      : FromField<Sel[K]>;
  }>;

  type KeysFromSelection<Sel extends Selection<T>> = keyof Sel & string;

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

  type NewType = T extends z.ZodArray<infer R>
    ? // No types yet? Use the types from selection
      R extends z.ZodUnknown
      ? PipeArray<AllSelection>
      : // Otherwise, if we're an object – pick keys from the original.
      R extends z.ZodObject<infer R2>
      ? PipeArray<z.ZodObject<Pick<R2, KeysFromSelection<S>>>>
      : z.ZodNever
    : // Input was not an array, do a similar take/pick approach
    T extends z.ZodUnknown
    ? PipeSingleEntity<AllSelection>
    : T extends z.ZodObject<infer R2>
    ? PipeSingleEntity<z.ZodObject<Pick<R2, KeysFromSelection<S>>>>
    : z.ZodNever;

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

  const newSchema = (() => {
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
    if (
      (schema instanceof z.ZodArray ? schema.element : schema) instanceof
      z.ZodUnknown
    ) {
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

      return schema instanceof z.ZodArray ? z.array(s) : s;
    }
    // If we're already dealing with an object schema inside our array, we need to do a Pick
    else if (
      (schema instanceof z.ZodArray ? schema.element : schema) instanceof
      z.ZodObject
    ) {
      const toPick = Object.keys(selection).reduce<{
        [key: string]: true;
      }>((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});

      return schema instanceof z.ZodArray
        ? z.array(schema.element.pick(toPick))
        : // TODO: don't cast here, should probably narrow types somewhere else
          (schema as z.ZodObject<any>).pick(toPick);
    }
    // If not unknown/object, I don't know what happened 👀
    else {
      return z.array(z.object({}));
    }
  })();

  const res = (schema instanceof z.ZodArray
    ? new PipeArray({
        query: query + `{${projections.join(", ")}}`,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore TODO: probably should figure out what's making tsc upset here
        schema: newSchema,
      })
    : new PipeSingleEntity({
        query: query + `{${projections.join(", ")}}`,
        schema: newSchema,
      })) as unknown as PipeArray<AllSelection>;

  return res as unknown as NewType;
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

export type Selection<Base> = Record<
  Base extends z.ZodUnknown
    ? string
    : Base extends z.ZodObject<infer R>
    ? keyof R
    : never,
  PipeBase<any> | z.ZodType | [string, z.ZodType]
>;
