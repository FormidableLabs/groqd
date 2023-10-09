export type Primitive = number | string | boolean | null | undefined | symbol;

export type ValueOf<T> = T[keyof T];
export type Get<TObj, TKey> = TKey extends keyof TObj
  ? TObj[TKey]
  : TypeMismatchError<{
      error: "Invalid property";
      expected: keyof TObj;
      actual: TKey;
    }>;

export type Simplify<T> = {
  [KeyType in keyof T]: T[KeyType];
} & {};

export type SimplifyDeep<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: SimplifyDeep<O[K]> }
    : never
  : T;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type Override<T, TOverrides> = Omit<T, keyof TOverrides> & TOverrides;

export type MaybeArrayItem<T> = T extends Array<infer TItem> ? TItem : T;
export type ArrayItem<T> = T extends Array<infer TItem>
  ? TItem
  : TypeMismatchError<{ error: "Expected an array"; expected: Array<any>; actual: T }>;

export type TypeMismatchError<TError extends { error: string; expected: any; actual: any }> = {
  error: TError["error"];
  expected: TError["expected"];
  actual: TError["actual"];
};
