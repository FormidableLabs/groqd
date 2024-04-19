import * as React from "react";
import { useClient } from "sanity";
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
  Tooltip,
} from "@sanity/ui";
import { z } from "zod";
import * as q from "groqd";
import has from "lodash.has";
import { BaseQuery } from "groqd/src/baseQuery";
import Split from "@uiw/react-split";
import { PlayIcon, ResetIcon } from "@sanity/icons";
import { GroqdPlaygroundProps } from "../types";
import { useDatasets } from "../util/useDatasets";
import { API_VERSIONS, DEFAULT_API_VERSION, STORAGE_KEYS } from "../consts";
import { ShareUrlField } from "./ShareUrlField";
import { useCopyDataAndNotify } from "../util/copyDataToClipboard";
import { emitInit, emitReset } from "../util/messaging";
import { JSONExplorer } from "./JSONExplorer";
import { CopyQueryButton, ErrorLineItem } from "./Playground.styled";
import { formatErrorPath } from "../../../../shared/util/formatErrorPath";

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
      rawExecutionTime,
      errorPaths,
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
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const editorContainer = React.useRef<HTMLDivElement>(null);
  const editorInitialWidth = React.useMemo(
    () =>
      +(localStorage.getItem(STORAGE_KEYS.EDITOR_WIDTH) || 0) ||
      EDITOR_INITIAL_WIDTH,
    []
  );
  const copyShareUrl = useCopyDataAndNotify("Copied share URL to clipboard!");
  const copyQueryUrl = useCopyDataAndNotify("Copied Query to clipboard!");
  const windowHref = window.location.href;

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
      q.makeSafeQueryRunner(
        (query, params?: Record<string, string | number>) =>
          new Promise((resolve, reject) => {
            client.observable
              .fetch(query, params, { filterResponse: false })
              .subscribe({
                next: (res) => {
                  dispatch({
                    type: "RAW_RESPONSE_RECEIVED",
                    payload: { rawResponse: res.result, execTime: res.ms },
                  });
                  resolve(res.result);
                },
                error: (err) => {
                  reject(err);
                },
              });
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
      /**
       * Generate error paths
       */
      let errorPaths: Map<string, string> | undefined;
      if (err instanceof q.GroqdParseError) {
        errorPaths = new Map();
        for (const e of err.zodError.errors) {
          // If "Required" message and missing path, we're going to want to
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
        type: "FETCH_PARSE_FAILURE",
        payload: { fetchParseError: err, errorPaths },
      });
    }
  };

  React.useEffect(() => {
    const handleMessage = (message: MessageEvent) => {
      if (message.origin !== EDITOR_ORIGIN) return;

      try {
        const payload = messageSchema.parse(JSON.parse(message.data));

        if (payload.event === "READY") {
          const storedCode =
            new URL(window.location.href).searchParams.get("code") ||
            localStorage.getItem(STORAGE_KEYS.CODE);

          message.source &&
            emitInit(message.source, EDITOR_ORIGIN, {
              code: storedCode || undefined,
              origin: window.location.origin,
            });
        } else if (payload.event === "INPUT") {
          localStorage.setItem(STORAGE_KEYS.CODE, payload.compressedRawCode);
          setQP("code", payload.compressedRawCode);

          if (payload.requestShareCopy) {
            copyShareUrl(window.location.href);
          }

          let playgroundRunQueryCount = 0;
          const libs = {
            groqd: q,
            playground: {
              runQuery: (
                query: BaseQuery<any>,
                params?: Record<string, string | number>
              ) => {
                playgroundRunQueryCount++;
                if (playgroundRunQueryCount > 1) return;

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

  const handleDatasetChange = (datasetName: string) => {
    dispatch({ type: "SET_ACTIVE_DATASET", payload: { dataset: datasetName } });
  };
  const handleAPIVersionChange = (apiVersion: string) => {
    dispatch({ type: "SET_ACTIVE_API_VERSION", payload: { apiVersion } });
  };

  const handleReset = () => {
    iframeRef.current && emitReset(iframeRef.current, EDITOR_ORIGIN);
  };

  const handleCopyQuery = () => query.query && copyQueryUrl(query.query);

  const handleEditorResize = () => {
    const container = editorContainer.current;
    if (!container) return;

    localStorage.setItem(
      STORAGE_KEYS.EDITOR_WIDTH,
      String(container.clientWidth)
    );
  };

  const responseView = (() => {
    if (isFetching) {
      return (
        <Flex justify="center" flex={1} align="center">
          <Spinner muted />
        </Flex>
      );
    }

    const execTimeDisplay = rawExecutionTime && (
      <Tooltip
        placement="right-end"
        content={
          <Box padding={2}>
            <Text>Raw execution time of query</Text>
          </Box>
        }
      >
        <span> ({rawExecutionTime}ms)</span>
      </Tooltip>
    );

    if (fetchParseError || errorPaths?.size) {
      let errorView = null;
      const scrollToError = (path: string) => {
        const lineEl = document.getElementById(`json-item-${path}`);
        if (lineEl instanceof HTMLElement)
          lineEl.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      if (errorPaths) {
        errorView = (
          <Stack space={2} flex={1} paddingX={3} paddingY={1}>
            <Box marginBottom={1}>
              <Text weight="semibold" size={1}>
                Error parsing:
              </Text>
            </Box>
            {[...errorPaths.entries()].map(([path, message]) => (
              <ErrorLineItem
                key={path}
                onClick={() => scrollToError(path)}
                padding={1}
              >
                <Text size={2}>
                  `result{formatErrorPath(path)}`: {message}
                </Text>
              </ErrorLineItem>
            ))}
          </Stack>
        );
      } else if (fetchParseError instanceof Error) {
        errorView = <pre>{fetchParseError.message}</pre>;
      } else {
        errorView = <span>Something went wrong...</span>;
      }

      return (
        <Flex flex={1} direction="column">
          <Split mode="vertical">
            <Flex direction="column" style={{ maxHeight: 400 }}>
              <Box marginY={3} paddingX={3}>
                <Label muted>❗Error</Label>
              </Box>
              <Box flex={1} overflow="auto">
                {errorView}
              </Box>
            </Flex>
            <Flex flex={1} direction="column">
              <Box paddingX={3} marginY={3}>
                <Label muted>Raw Response {execTimeDisplay}</Label>
              </Box>
              <Box flex={1} style={{ height: "100%" }}>
                <JSONExplorer
                  data={rawResponse}
                  highlightedPaths={errorPaths}
                />
              </Box>
            </Flex>
          </Split>
        </Flex>
      );
    }

    return (
      <Flex flex={1} direction="column" style={{ maxHeight: "100%" }}>
        <Box padding={3}>
          <Label muted>Query Response {execTimeDisplay}</Label>
        </Box>
        {parsedResponse ? <JSONExplorer data={parsedResponse} /> : null}
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

          {/* Share URL*/}
          <ShareUrlField
            url={windowHref}
            title="Share URL"
            column={queryUrl ? 4 : 8}
            notificationMessage="Copied share URL to clipboard!"
          />
          {/* Query URL */}
          {queryUrl && (
            <ShareUrlField
              url={queryUrl}
              title="Raw Query URL"
              notificationMessage="Copied raw query URL to clipboard!"
            />
          )}
        </Grid>
      </Card>

      <Box flex={1}>
        <Split
          style={{ width: "100%", height: "100%", overflow: "hidden" }}
          onDragEnd={handleEditorResize}
        >
          <div
            style={{
              width: editorInitialWidth,
              minWidth: 200,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
            ref={editorContainer}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <iframe
                src={EDITOR_URL}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                ref={iframeRef}
              />
              <div style={{ position: "absolute", bottom: 12, left: 12 }}>
                <Button
                  icon={ResetIcon}
                  text="Reset"
                  mode="ghost"
                  onClick={handleReset}
                />
              </div>
            </div>
            <Card paddingTop={3} paddingBottom={3} borderTop>
              <Stack space={3}>
                <Box>
                  <Box paddingX={3} marginBottom={1}>
                    <Label muted>
                      Query{"  "}
                      {query.query && (
                        <CopyQueryButton onClick={handleCopyQuery} tabIndex={0}>
                          (Copy to clipboard)
                        </CopyQueryButton>
                      )}
                    </Label>
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
              width: `calc(100% - ${editorInitialWidth}px)`,
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

const EDITOR_URL =
  typeof process !== "undefined" &&
  process?.env?.SANITY_STUDIO_GROQD_PLAYGROUND_ENV === "development"
    ? "http://localhost:3069"
    : "https://unpkg.com/groqd-playground-editor@0.0.6/build/index.html";
const EDITOR_ORIGIN = new URL(EDITOR_URL).origin;

type Params = Record<string, string | number>;
type State = {
  query: BaseQuery<any>;
  params?: Params;
  queryUrl?: string;
  isFetching: boolean;
  rawExecutionTime?: number;
  rawResponse?: unknown;
  parsedResponse?: unknown;
  inputParseError?: Error;
  fetchParseError?: unknown;
  activeAPIVersion: string;
  activeDataset: string;
  errorPaths?: Map<string, string>;
};

type Action =
  | {
      type: "INPUT_EVAL_SUCCESS";
      payload: { query: BaseQuery<any>; params?: Params };
    }
  | { type: "INPUT_PARSE_FAILURE"; payload: { inputParseError: Error } }
  | { type: "MAKE_FETCH_REQUEST"; payload: { queryUrl: string } }
  | {
      type: "RAW_RESPONSE_RECEIVED";
      payload: { rawResponse: unknown; execTime: number };
    }
  | { type: "FETCH_RESPONSE_PARSED"; payload: { parsedResponse: unknown } }
  | {
      type: "FETCH_PARSE_FAILURE";
      payload: {
        fetchParseError: unknown;
        rawResponse?: unknown;
        errorPaths?: Map<string, string>;
      };
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
        rawExecutionTime: action.payload.execTime,
      };
    case "FETCH_RESPONSE_PARSED":
      return {
        ...state,
        parsedResponse: action.payload.parsedResponse,
        fetchParseError: undefined,
        errorPaths: undefined,
      };
    case "FETCH_PARSE_FAILURE":
      return {
        ...state,
        isFetching: false,
        fetchParseError: action.payload.fetchParseError,
        errorPaths: action.payload.errorPaths,
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

const EDITOR_INITIAL_WIDTH = 500;

const readySchema = z.object({
  event: z.literal("READY"),
});

const inputSchema = z.object({
  event: z.literal("INPUT"),
  compressedRawCode: z.string(),
  code: z.string(),
  requestImmediateFetch: z.boolean().optional().default(false),
  requestShareCopy: z.boolean().optional().default(false),
});

const errorSchema = z.object({
  event: z.literal("ERROR"),
  message: z.string(),
});

const messageSchema = z.union([inputSchema, errorSchema, readySchema]);

const url = new URL(window.location.href);
const setQP = (key: string, value: string) => {
  url.searchParams.set(key, value);
  window.history.replaceState(null, "", url);
};
