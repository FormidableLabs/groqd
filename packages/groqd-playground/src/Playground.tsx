import * as React from "react";
import { useClient } from "sanity";
import { Box, Code, Flex } from "@sanity/ui";
import { z } from "zod";
import * as q from "groqd";
import { BaseQuery } from "groqd/src/baseQuery";
import Split from "@uiw/react-split";

export default function GroqdPlayground() {
  const [
    { query, params, parsedResponse, fetchParseError, rawResponse },
    dispatch,
  ] = React.useReducer(reducer, { query: q.q("") });
  const client = useClient({ apiVersion: "v2021-10-21" });

  const runQuery = React.useRef(
    q.makeSafeQueryRunner((query, params?: Record<string, string | number>) =>
      client.fetch(query, params).then((res) => {
        dispatch({
          type: "RAW_RESPONSE_RECEIVED",
          payload: { rawResponse: res },
        });
        return res;
      })
    )
  );

  React.useEffect(() => {
    const handleMessage = (message: MessageEvent) => {
      if (message.origin !== "http://localhost:3069") return;

      try {
        const payload = messageSchema.parse(JSON.parse(message.data));

        if (payload.event === "INPUT") {
          const libs = {
            groqd: q,
            playground: {
              runQuery: (
                query: BaseQuery<any>,
                params?: Record<string, string | number>
              ) => {
                try {
                  dispatch({
                    type: "INPUT_EVAL_SUCCESS",
                    payload: { query, params },
                  });
                } catch {}
              },
            },
          };
          const scope = {
            exports: {},
            require: (name: keyof typeof libs) => libs[name],
          };
          const keys = Object.keys(scope);
          new Function(...keys, payload.code)(
            ...keys.map((key) => scope[key as keyof typeof scope])
          );
        } else if (payload.event === "ERROR") {
          console.error(payload.message);
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const iframeSrc = React.useMemo(() => {
    const url = new URL("http://localhost:3069");
    url.searchParams.append("host", window.location.href);
    return url.toString();
  }, []);

  const handleRun = async () => {
    try {
      const data = await runQuery.current(query, params);
      dispatch({
        type: "FETCH_RESPONSE_PARSED",
        payload: { parsedResponse: data },
      });
    } catch (err) {
      dispatch({
        type: "FETCH_PARSE_FAILURE",
        payload: { fetchParseError: err },
      });
    }
  };

  return (
    <Split style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <div style={{ width: EDITOR_INITIAL_WIDTH, minWidth: 200 }}>
        <iframe src={iframeSrc} width="100%" height="100%" />
      </div>
      <Box
        style={{
          width: `calc(100% - ${EDITOR_INITIAL_WIDTH}px)`,
          minWidth: 100,
        }}
      >
        <Split mode="vertical">
          <Box>
            <h3>Query</h3>
            <pre>{query.query}</pre>
            {params && Object.keys(params).length > 0 ? (
              <div>
                <h3>Params</h3>
                <ul>
                  {Object.entries(params).map(([key, value]) => (
                    <li key={key}>
                      ${key}: {value}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button onClick={handleRun}>RUN QUERY</button>
          </Box>
          <Flex flex={1} direction="column" overflow="hidden">
            {fetchParseError ? (
              <Box flex={1} overflow="auto">
                <h3>Error:</h3>
                <pre>
                  {fetchParseError instanceof Error
                    ? fetchParseError.message
                    : "Something went wrong."}
                </pre>
                <h3>Raw response:</h3>
                <Code language="json">
                  {JSON.stringify(rawResponse, null, 2)}
                </Code>
              </Box>
            ) : (
              <React.Fragment>
                <h3>Query Response</h3>
                <Box flex={1} overflow="auto">
                  <Code language="json">
                    {JSON.stringify(parsedResponse, null, 2)}
                  </Code>
                </Box>
              </React.Fragment>
            )}
          </Flex>
        </Split>
      </Box>
    </Split>
  );
}

type Params = Record<string, string | number>;
type State = {
  query: BaseQuery<any>;
  params?: Params;
  rawResponse?: unknown;
  parsedResponse?: unknown;
  inputParseError?: Error;
  fetchParseError?: unknown;
};

type Action =
  | {
      type: "INPUT_EVAL_SUCCESS";
      payload: { query: BaseQuery<any>; params?: Params };
    }
  | { type: "INPUT_PARSE_FAILURE"; payload: { inputParseError: Error } }
  | { type: "RAW_RESPONSE_RECEIVED"; payload: { rawResponse: unknown } }
  | { type: "FETCH_RESPONSE_PARSED"; payload: { parsedResponse: unknown } }
  | {
      type: "FETCH_PARSE_FAILURE";
      payload: { fetchParseError: unknown; rawResponse?: unknown };
    };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "INPUT_EVAL_SUCCESS":
      return {
        ...state,
        query: action.payload.query,
        params: action.payload.params,
        inputParseError: undefined,
      };
    case "INPUT_PARSE_FAILURE":
      return {
        ...state,
        inputParseError: action.payload.inputParseError,
      };
    case "RAW_RESPONSE_RECEIVED":
      return {
        ...state,
        rawResponse: action.payload.rawResponse,
      };
    case "FETCH_RESPONSE_PARSED":
      return {
        ...state,
        parsedResponse: action.payload.parsedResponse,
        fetchParseError: undefined,
      };
    case "FETCH_PARSE_FAILURE":
      return { ...state, fetchParseError: action.payload.fetchParseError };
    default:
      return state;
  }
};

const EDITOR_INITIAL_WIDTH = 500;

const inputSchema = z.object({
  event: z.literal("INPUT"),
  code: z.string(),
});

const errorSchema = z.object({
  event: z.literal("ERROR"),
  message: z.string(),
});

const messageSchema = z.union([inputSchema, errorSchema]);
