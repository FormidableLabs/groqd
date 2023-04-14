import * as React from "react";
import { useClient } from "sanity";
import { Box, Code, Flex, Stack } from "@sanity/ui";
import { z } from "zod";
import * as q from "groqd";
import { BaseQuery } from "groqd/src/baseQuery";
import Split from "@uiw/react-split";

export default function GroqdPlayground() {
  const [query, setQuery] = React.useState<BaseQuery<any>>(q.q(""));
  const [response, setResponse] = React.useState("");
  const client = useClient({ apiVersion: "v2021-10-21" });

  const runQuery = React.useRef(
    q.makeSafeQueryRunner((query) => client.fetch(query))
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
              runQuery: (query: BaseQuery<any>) => {
                try {
                  setQuery(query);
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
      const data = await runQuery.current(query);
      setResponse(JSON.stringify(data, null, 2)); // TODO: JSON explorer
    } catch (err) {
      if (err instanceof q.GroqdParseError) {
        setResponse(err.message);
      }
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
          </Box>
          <Flex flex={1} direction="column" overflow="hidden">
            <h3>Query Response</h3>
            <button onClick={handleRun}>RUN QUERY</button>
            <Box flex={1} overflow="auto">
              <Code language="json">{response}</Code>
            </Box>
          </Flex>
        </Split>
      </Box>
    </Split>
  );
}

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
