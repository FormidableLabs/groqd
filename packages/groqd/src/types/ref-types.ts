import { TypeMismatchError } from "./type-mismatch-error";
import { QueryConfig } from "./query-config";
import { ExtractDocumentTypes } from "./document-types";

export type RefType<referenceSymbol extends symbol, TTypeName> = {
  [P in referenceSymbol]?: TTypeName;
};
export type ExtractRefType<TResultItem, TQueryConfig extends QueryConfig> =
  //
  TResultItem extends RefType<TQueryConfig["referenceSymbol"], infer TTypeName>
    ? Extract<TQueryConfig["schemaTypes"], { _type: TTypeName }>
    : TypeMismatchError<{
        error: "⛔️ Expected the object to be a reference type ⛔️";
        expected: RefType<
          TQueryConfig["referenceSymbol"],
          ExtractDocumentTypes<TQueryConfig["schemaTypes"]>
        >;
        actual: TResultItem;
      }>;

export type DerefDeep<T, TQueryConfig extends QueryConfig> = T extends Array<
  infer U
>
  ? Array<DerefDeep<U, TQueryConfig>>
  : T extends null
  ? T
  : T extends RefType<TQueryConfig["referenceSymbol"], infer TTypeName>
  ? Extract<TQueryConfig["schemaTypes"], { _type: TTypeName }>
  : TypeMismatchError<{
      error: "⛔️ Expected the object to be a reference type ⛔️";
      expected: RefType<
        TQueryConfig["referenceSymbol"],
        ExtractDocumentTypes<TQueryConfig["schemaTypes"]>
      >;
      actual: T;
    }>;
