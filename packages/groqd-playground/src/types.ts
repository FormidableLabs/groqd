import { ComponentType } from "react";

export type PlaygroundToolConfig = Partial<PlaygroundConfig> & {
  name?: string;
  title?: string;
  icon?: ComponentType;
};

export type PlaygroundConfig = {
  defaultApiVersion: string;
  defaultDataset: string;
};
