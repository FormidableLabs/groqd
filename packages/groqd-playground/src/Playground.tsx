import * as React from "react";
import { useClient } from "sanity";

export default function GroqdPlayground() {
  const [query, setQuery] = React.useState("");
  const [response, setResponse] = React.useState("");
  const client = useClient({ apiVersion: "v2021-10-21" });

  React.useEffect(() => {
    const handleMessage = (message: MessageEvent) => {
      if (message.origin !== "http://localhost:3069") return;

      try {
        const payload = JSON.parse(message.data);
        if (!isQueryPayload(payload) || !payload.query) return;
        setQuery(payload.query);
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

  const handleRun = () => {
    // Try to query?
    client
      .fetch(query)
      .then((res) => {
        setResponse(JSON.stringify(res, null, 2));
      })
      .catch(console.error);
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
            <pre>{query}</pre>
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

type QueryPayload = { event: "QUERY"; query: string };
const isQueryPayload = (
  maybePayload: unknown
): maybePayload is QueryPayload => {
  return (
    "event" in maybePayload &&
    maybePayload.event === "QUERY" &&
    "query" in maybePayload &&
    typeof maybePayload.query === "string"
  );
};
