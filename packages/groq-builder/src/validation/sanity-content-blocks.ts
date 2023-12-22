import { memo, primitiveValidation } from "./primitives";

export const sanityValidation = {
  contentBlock: memo(<
    TConfig extends ContentBlockConfig = ContentBlockConfig
  >() => primitiveValidation.object<ContentBlock<TConfig>>()),

  contentBlocks: memo(<
    TConfig extends ContentBlockConfig = ContentBlockConfig
  >() => primitiveValidation.array<Array<ContentBlock<TConfig>>>()),
};

export type ContentBlocks<
  TConfig extends ContentBlockConfig = ContentBlockConfig
> = Array<ContentBlock<TConfig>>;
export type ContentBlock<
  TConfig extends ContentBlockConfig = ContentBlockConfig
> = {
  _type: string;
  _key?: string;
  children: Array<{
    _key: string;
    _type: string;
    text: string;
    marks?: string[];
  }>;
  style?: string;
  listItem?: string;
  level?: number;
} & TConfig;
export type ContentBlockConfig = {
  markDefs?: Array<{ _type: string; _key: string }>;
};
