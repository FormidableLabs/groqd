import { z } from "zod";
import { BaseResult, ValueOf } from "./types";

/**
 * Create a "projection" to grab fields from a document/list of documents.
 * @param {object} selection - Fields to grab
 * @param {object} conditionalSelections – Conditional fields to grab
 */
export const grab =
  <S extends Selection, CondSelections extends Record<string, Selection>>(
    selection: S,
    conditionalSelections?: CondSelections
  ) =>
  <T>(prev: BaseResult<T>) => {
    type FromSelection<T extends Selection> = z.ZodObject<{
      [K in keyof T as K extends `${infer Key}:${string}`
        ? Key
        : K]: T[K] extends BaseResult<any> ? T[K]["schema"] : FromField<T[K]>;
    }>;
    type KeysFromSelection<T extends Selection> =
      (keyof T extends `${infer Key}:${string}` ? Key : T) & string;

    type AllSelection = typeof conditionalSelections extends undefined
      ? FromSelection<S>
      : z.ZodUnion<
          [
            ValueOf<{
              [K in keyof CondSelections]: FromSelection<S & CondSelections[K]>;
            }>
          ]
        >;

    // Start with array type
    type NewType = T extends z.ZodArray<infer R>
      ? // No types yet? Use the types from selection
        R extends z.ZodUnknown
        ? z.ZodArray<AllSelection>
        : // Otherwise, if we're an object – pick keys from the original.
        R extends z.ZodObject<infer R2>
        ? z.ZodArray<z.ZodObject<Pick<R2, KeysFromSelection<S>>>> // TODO: Might need to tweak this... not sure if just pulling from S is correct
        : z.ZodNever
      : // Input was not an array, do a similar take/pick approach
      T extends z.ZodUnknown
      ? AllSelection
      : T extends z.ZodObject<infer R2>
      ? z.ZodArray<z.ZodObject<Pick<R2, KeysFromSelection<S>>>> // TODO: Tweak this???
      : z.ZodNever;

    // Recursively define projections to pick up nested conditionals
    const getProjections = (sel: Selection) =>
      Object.entries(sel).reduce<string[]>((acc, [key, val]) => {
        let toPush = "";
        if ("query" in val) {
          toPush = `"${key}": ${val.query}`;
        } else if (Array.isArray(val)) {
          toPush = `"${key}": ${val[0]}`;
        } else {
          toPush = key;
        }

        toPush && acc.push(toPush);
        return acc;
      }, []);
    const projections = [...getProjections(selection)];
    if (conditionalSelections) {
      const condProjections = Object.entries(conditionalSelections).reduce<
        string[]
      >((acc, [key, val]) => {
        acc.push(`${key} => { ${getProjections(val).join(", ")} }`);
        return acc;
      }, []);

      projections.push(`...select(${condProjections.join(", ")})`);
    }

    // Schema gets a bit trickier, since we sort of have to mock GROQ behavior.
    const schema = (() => {
      const toSchemaInput = (sel: Selection) =>
        Object.entries(sel).reduce<z.ZodRawShape>((acc, [key, value]) => {
          if ("schema" in value) {
            acc[key] = value.schema;
          } else if (Array.isArray(value)) {
            acc[key] = value[1];
          } else {
            acc[key] = value;
          }
          return acc;
        }, {});

      // Unknown schema means we just use the selection passed
      if (
        (prev.schema instanceof z.ZodArray
          ? prev.schema.element
          : prev.schema) instanceof z.ZodUnknown
      ) {
        // Split base and conditional fields
        const conditionalFields = Object.values(conditionalSelections || {});

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

        return prev.schema instanceof z.ZodArray ? z.array(s) : s;
      }
      // If we're already dealing with an object schema inside our array, we need to do a Pick
      else if (
        (prev.schema instanceof z.ZodArray
          ? prev.schema.element
          : prev.schema) instanceof z.ZodObject
      ) {
        const toPick = Object.keys(selection).reduce<{
          [key: string]: true;
        }>((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});

        return prev.schema instanceof z.ZodArray
          ? z.array(prev.schema.element.pick(toPick))
          : (prev.schema as z.ZodObject<any>).pick(toPick);
      }
      // If not unknown/object, I don't know what happened 👀
      else {
        return z.never();
      }
    })();

    return {
      query: prev.query + `{${projections.join(", ")}}`,
      schema: schema,
    } as BaseResult<NewType>;
  };

type Field<T extends z.ZodType> = T;
type FromField<T> = T extends Field<infer R>
  ? R
  : T extends [string, infer R]
  ? R
  : z.ZodNever;

type Selection = Record<
  string,
  BaseResult<any> | z.ZodType | [string, z.ZodType]
>;
