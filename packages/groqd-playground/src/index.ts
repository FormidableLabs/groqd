import { definePlugin } from "sanity";
import { lazy } from "react";
import { route } from "sanity/router";
import { CodeIcon } from "@sanity/icons";
import { PlaygroundToolConfig } from "./types";

export const groqdPlaygroundTool = definePlugin<PlaygroundToolConfig | void>(
  ({ name, title, icon, defaultApiVersion, defaultDataset } = {}) => {
    return {
      name: "groqd-playground",
      tools: [
        {
          name: name || "groqd-playground",
          title: title || "GROQD",
          icon: CodeIcon || icon,
          component: lazy(() => import("./Playground")),
          options: {
            defaultApiVersion: defaultApiVersion || "v2021-10-21",
            defaultDataset: defaultDataset || "production",
          },
          router: route.create("/*"),
        },
      ],
    };
  }
);
