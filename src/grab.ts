import { z } from "zod";
import { BaseResult, ValueOf } from "./types";

/**
 * Create a "projection" to grab fields from a document/list of documents.
 * @param {object} selection - Fields to grab
 */
export const grab =
  <S extends Selection>(selection: S) =>
  <T>(prev: BaseResult<T>) => {
    type FromSelection<T extends Selection> = z.ZodObject<{
      [K in keyof T as K extends `${infer Key}:${string}`
        ? Key
        : K]: T[K] extends BaseResult<any> ? T[K]["schema"] : FromField<T[K]>;
    }>;
    type KeysFromSelection<T extends Selection> =
      (keyof T extends `${infer Key}:${string}` ? Key : T) & string;

    type BaseSelection = {
      [K in keyof S as K extends `${string}=>` ? never : K]: S[K];
    };
    // TODO: Need to allow type when no conditional fields are met
    type AllSelection = {
      [K in keyof S as K extends `${string}=>` ? never : K]: S[K];
    } extends S
      ? FromSelection<S>
      : z.ZodUnion<
          [
            ValueOf<{
              [K in keyof S as K extends `${string}=>`
                ? K
                : never]: S[K] extends Selection<any>
                ? FromSelection<BaseSelection & S[K]>
                : never;
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
        } else if (typeof val === "object" && !(val instanceof z.ZodType)) {
          toPush = `${key} {${getProjections(val)}}`;
        } else {
          toPush = key;
        }

        toPush && acc.push(toPush);
        return acc;
      }, []);
    const projections = getProjections(selection);

    // Schema gets a bit trickier, since we sort of have to mock GROQ behavior.
    const schema = (() => {
      const toSchemaInput = (sel: Selection) =>
        Object.entries(sel).reduce<z.ZodRawShape>((acc, [key, value]) => {
          if ("schema" in value) {
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
        (prev.schema instanceof z.ZodArray
          ? prev.schema.element
          : prev.schema) instanceof z.ZodUnknown
      ) {
        // Split base and conditional fields
        const baseFields = {} as Selection;
        const conditionalFields = [] as Selection[];
        Object.entries(selection).forEach(([key, value]) => {
          if (key.endsWith("=>")) conditionalFields.push(value as Selection);
          else baseFields[key] = value;
        });

        const baseSchema = z.object(toSchemaInput(baseFields));
        const foo = conditionalFields.map((field) =>
          baseSchema.merge(z.object(toSchemaInput(field)))
        );
        const s = foo.length === 0 ? baseSchema : z.union([...foo, baseSchema]);

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

type Selection<Keys extends PropertyKey = any> = {
  [K in Keys]: K extends `${string}=>`
    ? Selection
    : BaseResult<any> | z.ZodType | [string, z.ZodType];
};

const isSelection = (val: any): val is Selection =>
  typeof val === "object" && !Array.isArray(val);
