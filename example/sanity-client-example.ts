import sanityClient from "@sanity/client";
import { makeSafeQueryRunner } from "../src";

const client = sanityClient({
  projectId: "your-project-id",
  apiVersion: "2021-03-25",
});

export const runQuery = makeSafeQueryRunner(client.fetch);
