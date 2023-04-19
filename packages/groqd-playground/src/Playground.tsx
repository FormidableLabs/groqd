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
  Spinner,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@sanity/ui";
import { z } from "zod";
import * as q from "groqd";
import { BaseQuery } from "groqd/src/baseQuery";
import Split from "@uiw/react-split";
import { CopyIcon, PlayIcon } from "@sanity/icons";
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
      queryUrl,
      isFetching,
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

    return {
      query: q.q(""),
      activeDataset,
      activeAPIVersion,
      isFetching: false,
    };
  });
  const operationUrlRef = React.useRef<HTMLInputElement>(null);

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

  const generateQueryUrl = (query: q.BaseQuery<any>, params?: Params) => {
    const searchParams = new URLSearchParams();
    searchParams.append("query", query.query);
    if (params) {
      for (const [key, value] of Object.entries(params))
        searchParams.append(key, String(value));
    }

    return client.getUrl(
      client.getDataUrl("query", "?" + searchParams.toString())
    );
  };

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

  const handleRun = async (query: q.BaseQuery<any>, params?: Params) => {
    dispatch({
      type: "MAKE_FETCH_REQUEST",
      payload: { queryUrl: generateQueryUrl(query, params) },
    });
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
                    if (payload.requestImmediateFetch) {
                      handleRun(query, params);
                    }
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

  const handleDatasetChange = (datasetName: string) => {
    dispatch({ type: "SET_ACTIVE_DATASET", payload: { dataset: datasetName } });
  };
  const handleAPIVersionChange = (apiVersion: string) => {
    dispatch({ type: "SET_ACTIVE_API_VERSION", payload: { apiVersion } });
  };
  const handleCopyQueryUrl = async () => {
    const el = operationUrlRef.current;
    if (!el) return;

    try {
      el.select();
      await navigator.clipboard.writeText(el.value);
      console.log("COPIED!");
    } catch {}
  };

  const responseView = (() => {
    if (isFetching) {
      return (
        <Flex justify="center" flex={1} align="center">
          <Spinner muted />
        </Flex>
      );
    }

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

          {/* Query URL */}
          {queryUrl && (
            <Box padding={1} flex={1} column={8}>
              <Stack>
                <Card paddingY={2}>
                  <Label muted>Query URL</Label>
                </Card>
                <Flex flex={1} gap={1}>
                  <Box flex={1}>
                    <TextInput
                      readOnly
                      type="url"
                      value={queryUrl}
                      ref={operationUrlRef}
                    />
                  </Box>
                  <Tooltip
                    content={
                      <Box padding={2}>
                        <Text>Copy to clipboard</Text>
                      </Box>
                    }
                  >
                    <Button
                      aria-label="Copy to clipboard"
                      type="button"
                      mode="ghost"
                      icon={CopyIcon}
                      onClick={handleCopyQueryUrl}
                    />
                  </Tooltip>
                </Flex>
              </Stack>
            </Box>
          )}
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
            <Card paddingTop={3} paddingBottom={3} borderTop>
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
                onClick={() => handleRun(query, params)}
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

const EDITOR_ORIGIN =
  process.env.SANITY_STUDIO_GROQD_PLAYGROUND_ENV === "development"
    ? "http://localhost:3069"
    : "https://unpkg.com/groqd-playground-editor@0.0.2/build/index.html";

type Params = Record<string, string | number>;
type State = {
  query: BaseQuery<any>;
  params?: Params;
  queryUrl?: string;
  isFetching: boolean;
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
  | { type: "MAKE_FETCH_REQUEST"; payload: { queryUrl: string } }
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
    case "MAKE_FETCH_REQUEST":
      return {
        ...state,
        isFetching: true,
        queryUrl: action.payload.queryUrl,
      };
    case "RAW_RESPONSE_RECEIVED":
      return {
        ...state,
        isFetching: false,
        rawResponse: action.payload.rawResponse,
      };
    case "FETCH_RESPONSE_PARSED":
      return {
        ...state,
        parsedResponse: action.payload.parsedResponse,
        fetchParseError: undefined,
      };
    case "FETCH_PARSE_FAILURE":
      return {
        ...state,
        isFetching: false,
        fetchParseError: action.payload.fetchParseError,
      };
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
  requestImmediateFetch: z.boolean().optional().default(false),
});

const errorSchema = z.object({
  event: z.literal("ERROR"),
  message: z.string(),
});

const messageSchema = z.union([inputSchema, errorSchema]);
