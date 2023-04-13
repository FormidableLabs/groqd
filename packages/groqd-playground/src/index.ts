import { definePlugin } from "sanity";
import { lazy } from "react";
import { route } from "sanity/router";

export const groqdPlaygroundTool = definePlugin(() => {
  return {
    name: "groqd-playground",
    tools: [
      {
        name: "groqd-playground",
        title: "GROQD",
        component: lazy(() => import("./Playground")),
        options: {},
        router: route.create("/*"),
      },
    ],
  };
});
