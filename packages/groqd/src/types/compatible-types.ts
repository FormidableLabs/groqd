/**
 * Picks all the keys where the value is compatible with the Condition type.
 */
export type CompatiblePick<Base, Condition> = Pick<
  Base,
  CompatibleKeys<Base, Condition>
>;

/**
 * Returns all keys, where the value is compatible with the Condition type.
 */
export type CompatibleKeys<Base, Condition> = {
  [Key in keyof Base]-?: TypesAreCompatible<Base[Key], Condition> extends true
    ? Key
    : never;
}[keyof Base];

/**
 * Returns true if A and B are compatible types, like strings, literals, numbers, etc.
 */
export type TypesAreCompatible<A, B> =
  // Wrap in a Tuple to avoid Distributed Conditional Types
  [A] extends [B] ? true : [B] extends [A] ? true : false;
