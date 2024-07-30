/**
 * ---------------------------------------------------------------------------------
 * This file has been generated by Sanity TypeGen.
 * Command: `sanity typegen generate`
 *
 * Any modifications made directly to this file will be overwritten the next time
 * the TypeScript definitions are generated. Please make changes to the Sanity
 * schema definitions and/or GROQ queries if you need to update these types.
 *
 * For more information on how to use Sanity TypeGen, visit the official documentation:
 * https://www.sanity.io/docs/sanity-typegen
 * ---------------------------------------------------------------------------------
 */

export type User = {
  _id: string;
  _type: "user";
  name: string;
};

export type Todo = {
  _id: string;
  _type: "poketype";
  user: {
    type: "reference";
    _ref: string;
    [internalGroqTypeReferenceTo]: "user";
  };
  title: string;
  completed: boolean;
};

export type AllSanitySchemaTypes = User | Todo;
export declare const internalGroqTypeReferenceTo: unique symbol;
