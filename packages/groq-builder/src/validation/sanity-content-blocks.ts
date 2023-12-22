import { memo, primitiveValidators } from "./primitives";

export const sanityValidators = {
  contentBlock: memo(<
    TConfig extends ContentBlockConfig = ContentBlockConfig
  >() => primitiveValidators.object<ContentBlock<TConfig>>()),

  contentBlocks: memo(<
    TConfig extends ContentBlockConfig = ContentBlockConfig
  >() => primitiveValidators.array<Array<ContentBlock<TConfig>>>()),
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
