import * as React from "react";
import { type Tool, useClient } from "sanity";
import {
  Box,
  Button,
  Card,
  Code,
  Flex,
  Grid,
  Label,
  Select,
  Stack,
  Text,
} from "@sanity/ui";
import { z } from "zod";
import * as q from "groqd";
import { BaseQuery } from "groqd/src/baseQuery";
import Split from "@uiw/react-split";
import { PlayIcon } from "@sanity/icons";
import { PlaygroundConfig } from "./types";
import { useDatasets } from "./useDatasets";
import { API_VERSIONS, DEFAULT_API_VERSION, STORAGE_KEYS } from "./consts";

type GroqdPlaygroundProps = {
  tool: Tool<PlaygroundConfig>;
};

export default function GroqdPlayground({ tool }: GroqdPlaygroundProps) {
  const [
    {
      query,
      params,
      parsedResponse,
      fetchParseError,
      rawResponse,
      activeDataset,
      activeAPIVersion,
    },
    dispatch,
  ] = React.useReducer(reducer, null, () => {
    const activeDataset =
      localStorage.getItem(STORAGE_KEYS.DATASET) ||
      tool.options?.defaultDataset ||
      "production";
    const activeAPIVersion =
      localStorage.getItem(STORAGE_KEYS.API_VERSION) ||
      tool.options?.defaultApiVersion ||
      DEFAULT_API_VERSION;

    return { query: q.q(""), activeDataset, activeAPIVersion };
  });

  // Configure client
  const _client = useClient({
    apiVersion: tool.options?.defaultApiVersion || "v2021-10-21",
  });
  const client = React.useMemo(
    () =>
      _client.withConfig({
        dataset: activeDataset,
        apiVersion: activeAPIVersion,
      }),
    [_client, activeDataset, activeAPIVersion]
  );
  const datasets = useDatasets(_client);

  // Make sure activeDataset isn't outside of available datasets.
  React.useEffect(() => {
    if (datasets[0] && !datasets.includes(activeDataset))
      handleDatasetChange(datasets[0]);
  }, [datasets]);

  const runQuery = React.useMemo(
    () =>
      q.makeSafeQueryRunner((query, params?: Record<string, string | number>) =>
        client.fetch(query, params).then((res) => {
          dispatch({
            type: "RAW_RESPONSE_RECEIVED",
            payload: { rawResponse: res },
          });
          return res;
        })
      ),
    [client]
  );

  React.useEffect(() => {
    const handleMessage = (message: MessageEvent) => {
      if (message.origin !== EDITOR_ORIGIN) return;

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
                  if (query instanceof q.BaseQuery) {
                    dispatch({
                      type: "INPUT_EVAL_SUCCESS",
                      payload: { query, params },
                    });
                  }
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
    const url = new URL(EDITOR_ORIGIN);
    url.searchParams.append("host", window.location.href);
    return url.toString();
  }, []);

  const handleRun = async () => {
    try {
      const data = await runQuery(query, params);
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

  const handleDatasetChange = (datasetName: string) => {
    dispatch({ type: "SET_ACTIVE_DATASET", payload: { dataset: datasetName } });
  };
  const handleAPIVersionChange = (apiVersion: string) => {
    dispatch({ type: "SET_ACTIVE_API_VERSION", payload: { apiVersion } });
  };

  const responseView = (() => {
    if (fetchParseError) {
      return (
        <Flex style={{ height: "100%" }} direction="column">
          <Box marginY={3} paddingX={3}>
            <Label muted>Error</Label>
          </Box>
          <Box paddingX={3}>
            <pre>
              {fetchParseError instanceof Error
                ? fetchParseError.message
                : "Something went wrong."}
            </pre>
          </Box>
          <Box paddingX={3} marginY={3}>
            <Label muted>Raw Response</Label>
          </Box>
          <Box
            flex={1}
            paddingX={3}
            paddingBottom={3}
            paddingTop={1}
            overflow="auto"
          >
            <Code language="json" size={1}>
              {JSON.stringify(rawResponse, null, 2)}
            </Code>
          </Box>
        </Flex>
      );
    }

    return (
      <Flex flex={1} direction="column">
        <Box padding={3}>
          <Label muted>Query Response</Label>
        </Box>
        <Box flex={1} overflow="auto" padding={3}>
          {parsedResponse ? (
            <Code language="json" size={1}>
              {JSON.stringify(parsedResponse, null, 2)}
            </Code>
          ) : null}
        </Box>
      </Flex>
    );
  })();

  return (
    <Flex style={{ height: "100%" }} direction="column">
      <Card paddingX={3} paddingY={2} borderBottom>
        <Grid columns={[6, 6, 12]}>
          {/* Dataset selector */}
          <Box padding={1} column={2}>
            <Stack>
              <Card paddingY={2}>
                <Label muted>Dataset</Label>
              </Card>
              <Select
                value={activeDataset}
                onChange={(e) => handleDatasetChange(e.currentTarget.value)}
              >
                {datasets.map((ds) => (
                  <option key={ds}>{ds}</option>
                ))}
              </Select>
            </Stack>
          </Box>

          {/* API version selector */}
          <Box padding={1} column={2}>
            <Stack>
              <Card paddingY={2}>
                <Label muted>API Version</Label>
              </Card>
              <Select
                value={activeAPIVersion}
                onChange={(e) => handleAPIVersionChange(e.currentTarget.value)}
              >
                {API_VERSIONS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </Select>
            </Stack>
          </Box>
        </Grid>
      </Card>

      <Box flex={1}>
        <Split style={{ width: "100%", height: "100%", overflow: "hidden" }}>
          <div
            style={{
              width: EDITOR_INITIAL_WIDTH,
              minWidth: 200,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <iframe
              src={iframeSrc}
              width="100%"
              style={{ flex: 1, border: "none" }}
            />
            <Card paddingTop={3} paddingBottom={3}>
              <Stack space={3}>
                <Box>
                  <Box paddingX={3} marginBottom={1}>
                    <Label muted>Query</Label>
                  </Box>
                  <Flex padding={3} paddingBottom={4} overflow="auto">
                    <Code language="text">{query.query}</Code>
                    <Box width={3} />
                  </Flex>
                </Box>

                {params && Object.keys(params).length > 0 ? (
                  <Box paddingX={3}>
                    <Box marginBottom={3}>
                      <Label muted>Params</Label>
                    </Box>
                    <Stack space={3} marginLeft={3}>
                      {Object.entries(params).map(([key, value]) => (
                        <Text key={key} size={2} muted>
                          ${key}: {value}
                        </Text>
                      ))}
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
            </Card>
            <Card padding={3} borderTop>
              <Button
                tone="primary"
                icon={PlayIcon}
                text="Fetch"
                fontSize={[2]}
                padding={[3]}
                style={{ width: "100%" }}
                onClick={handleRun}
                disabled={!query.query}
              />
            </Card>
          </div>
          <Box
            style={{
              width: `calc(100% - ${EDITOR_INITIAL_WIDTH}px)`,
              minWidth: 100,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Flex flex={1} direction="column" overflow="hidden">
              {responseView}
            </Flex>
          </Box>
        </Split>
      </Box>
    </Flex>
  );
}

const IS_DEV = process.env.MODE === "development";
const EDITOR_ORIGIN = IS_DEV
  ? "http://localhost:3069"
  : "https://groqd-playground-editor.formidable.dev";

type Params = Record<string, string | number>;
type State = {
  query: BaseQuery<any>;
  params?: Params;
  rawResponse?: unknown;
  parsedResponse?: unknown;
  inputParseError?: Error;
  fetchParseError?: unknown;
  activeAPIVersion: string;
  activeDataset: string;
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
    }
  | { type: "SET_ACTIVE_DATASET"; payload: { dataset: string } }
  | { type: "SET_ACTIVE_API_VERSION"; payload: { apiVersion: string } };

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
    case "SET_ACTIVE_API_VERSION":
      localStorage.setItem(STORAGE_KEYS.API_VERSION, action.payload.apiVersion);
      return { ...state, activeAPIVersion: action.payload.apiVersion };
    case "SET_ACTIVE_DATASET":
      localStorage.setItem(STORAGE_KEYS.DATASET, action.payload.dataset);
      return { ...state, activeDataset: action.payload.dataset };
    default:
      return state;
  }
};

const EDITOR_INITIAL_WIDTH = 400;

const inputSchema = z.object({
  event: z.literal("INPUT"),
  code: z.string(),
});

const errorSchema = z.object({
  event: z.literal("ERROR"),
  message: z.string(),
});

const messageSchema = z.union([inputSchema, errorSchema]);
