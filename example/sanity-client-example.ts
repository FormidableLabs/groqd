import sanityClient from "@sanity/client";
import { makeSafeQueryRunner, q } from "../src";

const client = sanityClient({
  projectId: "your-project-id",
  apiVersion: "2021-03-25",
});

export const runQuery = makeSafeQueryRunner(
  (query: string, params: Record<string, unknown> = {}) =>
    client.fetch(query, params)
);
