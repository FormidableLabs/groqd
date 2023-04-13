import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import { groqdTool } from "groqd-playground";

export default defineConfig({
  name: "default",
  title: "formidable.com",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [deskTool(), visionTool(), groqdTool()],

  schema: {
    types: [],
  },
});
