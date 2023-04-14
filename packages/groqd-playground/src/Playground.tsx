import * as React from "react";
import { useClient } from "sanity";
import { z } from "zod";
import * as q from "groqd";
import { BaseQuery } from "groqd/src/baseQuery";

export default function GroqdPlayground() {
  const [query, setQuery] = React.useState<BaseQuery<any>>(q.q(""));
  const [response, setResponse] = React.useState("");
  const client = useClient({ apiVersion: "v2021-10-21" });

  const runQuery = React.useMemo(
    () => q.makeSafeQueryRunner((query) => client.fetch(query)),
    [client]
  );

  React.useEffect(() => {
    const handleMessage = (message: MessageEvent) => {
      if (message.origin !== "http://localhost:3069") return;

      try {
        const payload = messageSchema.parse(JSON.parse(message.data));

        if (payload.event === "INPUT") {
          console.log(payload.code);
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

          // setQuery(query)
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
      const data = await runQuery(query);
      setResponse(JSON.stringify(data, null, 2)); // TODO: JSON explorer
    } catch (err) {
      if (err instanceof q.GroqdParseError) {
        setResponse(err.message);
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div>
          <iframe src={iframeSrc} width="500" height="500" />
          <button onClick={handleRun}>RUN QUERY</button>
        </div>
        <div>
          <div>
            <h3>Query</h3>
            <pre>{query.query}</pre>
          </div>
          <div>
            <h3>Query Response</h3>
            <pre>{response}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputSchema = z.object({
  event: z.literal("INPUT"),
  code: z.string(),
});

const errorSchema = z.object({
  event: z.literal("ERROR"),
  message: z.string(),
});

const messageSchema = z.union([inputSchema, errorSchema]);
