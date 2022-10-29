import { z } from "zod";
import { BaseResult, Field, FromField } from "./types";

// TODO: prev argument should probably be dynamic so you can't do something like { name }{ name, age } (since age will null out)
// TODO: selection should be able to accept a sub-query for joins
export const select =
  <S extends Selection>(selection: S) =>
  <T>(prev: BaseResult<T>) => {
    type FromSelection<T extends Selection> = z.ZodObject<{
      [K in keyof T]: T[K] extends BaseResult<any>
        ? T[K]["schema"]
        : FromField<T[K]>;
    }>;
    type KeysFromSelection<T extends Selection> = keyof T & string;

    // Start with array type
    type NewType = T extends z.ZodArray<infer R>
      ? // No types yet? Use the types from selection
        R extends z.ZodUnknown
        ? z.ZodArray<FromSelection<S>>
        : // Otherwise, if we're an object – pick keys from the original.
        R extends z.ZodObject<infer R2>
        ? z.ZodArray<z.ZodObject<Pick<R2, KeysFromSelection<S>>>>
        : z.ZodNever
      : // Input was not an array, do a similar take/pick approach
      T extends z.ZodUnknown
      ? FromSelection<S>
      : T extends z.ZodObject<infer R2>
      ? z.ZodArray<z.ZodObject<Pick<R2, KeysFromSelection<S>>>>
      : z.ZodNever;

    const projections = Object.entries(selection).reduce<string[]>(
      (acc, [key, val]) => {
        acc.push("query" in val ? `"${key}": ${val.query}` : val.name);
        return acc;
      },
      []
    );

    // Schema gets a bit trickier, since we sort of have to mock GROQ behavior.
    const schema = (() => {
      // Array
      if (prev.schema instanceof z.ZodArray) {
        // Unknown schema means we just use the selection passed
        if (prev.schema.element instanceof z.ZodUnknown) {
          const s = Object.entries(selection).reduce<z.ZodRawShape>(
            (acc, [key, value]) => {
              acc[key] = value.schema;
              return acc;
            },
            {}
          );
          return z.array(z.object(s));
        }
        // If we're already dealing with an object schema inside our array, we need to do a Pick
        else if (prev.schema.element instanceof z.ZodObject) {
          const toPick = Object.keys(selection).reduce<{
            [key: string]: true;
          }>((acc, key) => {
            acc[key] = true;
            return acc;
          }, {});
          return z.array(prev.schema.element.pick(toPick));
        }
        // If not unknown/object, I don't know what happened 👀
        else {
          return z.never();
        }
      }
      // Not an array...
      else {
        if (prev.schema instanceof z.ZodUnknown) {
          const s = Object.entries(selection).reduce<z.ZodRawShape>(
            (acc, [key, value]) => {
              acc[key] = value.schema;
              return acc;
            },
            {}
          );
          return z.object(s);
        } else if (prev.schema instanceof z.ZodObject) {
          const toPick = Object.keys(selection).reduce<{
            [key: string]: true;
          }>((acc, key) => {
            acc[key] = true;
            return acc;
          }, {});
          return prev.schema.pick(toPick);
        }

        return z.never();
      }
    })();

    return {
      query: prev.query + `{${projections.join(", ")}}`,
      schema: schema,
    } as BaseResult<NewType>;
  };

type Selection = Record<string, Field<any> | BaseResult<any>>;
