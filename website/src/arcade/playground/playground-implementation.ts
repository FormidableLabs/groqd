import { evaluate, parse } from "groq-js";
import has from "lodash.has";

import { MODELS } from "../models";

import type { ArcadeDispatch, GroqdQueryParams } from "../state";
import toast from "react-hot-toast";
import * as q from "groqd";
import { GroqBuilder } from "groq-builder";
import type * as PlaygroundModule from "./index";

/**
 * This returns
 * @param dispatch
 * @param shouldRunQueryImmediately
 */
export function createPlaygroundModule({
  dispatch,
  shouldRunQueryImmediately,
}: {
  dispatch: ArcadeDispatch;
  shouldRunQueryImmediately?: boolean;
}): typeof PlaygroundModule {
  let playgroundRunQueryCount = 0;

  const moduleImplementation: typeof PlaygroundModule = {
    runQuery(query, params?) {
      playgroundRunQueryCount++;
      if (playgroundRunQueryCount > 1) return;

      try {
        if (query instanceof GroqBuilder) {
          // @ts-expect-error --- this is a hack so we can use`groq-builder` with the existing `groqd` logic:
          query.schema = { parse: query.parser || ((x) => x) };
        } else if (query instanceof q.BaseQuery) {
        } else {
          throw new Error("runQuery requires a GroqD query");
        }

        dispatch({
          type: "INPUT_EVAL_SUCCESS",
          payload: { query, params },
        });

        if (shouldRunQueryImmediately) {
          runQueryInternal({
            query: query as q.BaseQuery<any>,
            params,
            dispatch,
          });
        }
      } catch {
        toast.error("Failed to evaluate code.");
      }
    },
  };

  return moduleImplementation;
}

/**
 * Run a given query against dataset in the JSON model
 */
const runQueryInternal = async ({
  query,
  params,
  dispatch,
}: {
  query: q.BaseQuery<any>;
  dispatch: ArcadeDispatch;
  params: GroqdQueryParams;
}) => {
  if (!query.query) return;
  dispatch({ type: "START_QUERY_EXEC" });

  try {
    let json: unknown;
    try {
      json = JSON.parse(MODELS.json.getValue());
    } catch {
      throw new Error("Error parsing dataset JSON");
    }

    const runner = q.makeSafeQueryRunner(async (query: string) => {
      const tree = parse(query, { params });
      const _ = await evaluate(tree, { dataset: json });
      const rawResponse = await _.get();
      dispatch({ type: "RAW_RESPONSE_RECEIVED", payload: { rawResponse } });

      return rawResponse;
    });

    const data = await runner(query);
    dispatch({ type: "PARSE_SUCCESS", payload: { parsedResponse: data } });
  } catch (err) {
    let errorPaths: Map<string, string> | undefined;

    if (err instanceof q.GroqdParseError) {
      errorPaths = new Map();
      for (const e of err.zodError.errors) {
        if (e.message === "Required" && !has(err.rawResponse, e.path)) {
          errorPaths.set(
            e.path
              .slice(0, -1)
              .map((v) => String(v))
              .join("."),
            `Field "${e.path.at(-1)}" is Required`
          );
        } else {
          errorPaths.set(e.path.map((v) => String(v)).join("."), e.message);
        }
      }
    }

    dispatch({
      type: "PARSE_FAILURE",
      payload: { fetchParseError: err, errorPaths },
    });
  }
};
