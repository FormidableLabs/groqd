import { Get, Simplify, TypeMismatchError, ValueOf } from "./type-utils";

export type RootConfig = {
  TSchema: any;
  referenced: symbol;
};
export type RefType<referencedSymbol extends symbol, TTypeName> = {
  [P in referencedSymbol]: TTypeName;
};
export type ExtractRefType<TScope, TRootConfig extends RootConfig> =
  //
  TScope extends RefType<TRootConfig["referenced"], infer TTypeName>
    ? Get<TRootConfig["TSchema"], TTypeName>
    : TypeMismatchError<{
        error: "Expected the object to be a reference type";
        expected: RefType<
          TRootConfig["referenced"],
          keyof TRootConfig["TSchema"]
        >;
        actual: TScope;
      }>;
export type ExtractDocumentTypes<TRootConfig extends RootConfig> = Array<
  ValueOf<TRootConfig["TSchema"]>
>;
