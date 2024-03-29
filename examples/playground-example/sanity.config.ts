import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import { groqdPlaygroundTool } from "groqd-playground";

export default defineConfig({
  name: "default",
  title: "formidable.com",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [deskTool(), visionTool(), groqdPlaygroundTool({})],

  schema: {
    types: [],
  },
});
