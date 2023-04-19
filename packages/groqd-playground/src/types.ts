import { ComponentType } from "react";
import { Tool } from "sanity";

export type PlaygroundToolConfig = Partial<PlaygroundConfig> & {
  name?: string;
  title?: string;
  icon?: ComponentType;
};

export type PlaygroundConfig = {
  defaultApiVersion: string;
  defaultDataset: string;
};

export type GroqdPlaygroundProps = {
  tool: Tool<PlaygroundConfig>;
};
