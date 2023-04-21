import * as React from "react";
import { Stack, usePrefersDark } from "@sanity/ui";

type JSONExplorerDisplayProps = {
  data: unknown;
  prefix?: string;
  highlightedPaths?: Map<string, string>;
  currentPath?: string;
};

export const JSONExplorer = (props: JSONExplorerDisplayProps) => {
  return (
    <div style={{ fontFamily: "Menlo,monospace" }}>
      <JSONExplorerDisplay {...props} />
    </div>
  );
};

const JSONExplorerDisplay = ({
  data,
  prefix,
  highlightedPaths,
  currentPath = "",
}: JSONExplorerDisplayProps) => {
  const COLORS = useColors();
  const prefixDisplay =
    prefix !== undefined ? (
      <span style={{ color: COLORS.KEY }}>{prefix}: </span>
    ) : null;
  const errorMessage = highlightedPaths && highlightedPaths.get(currentPath);

  // Arrays
  if (Array.isArray(data)) {
    return (
      <Collapsible
        title={
          <React.Fragment>
            {prefixDisplay}
            <span style={{ color: COLORS.LABEL }}>
              [...] {data.length} items
            </span>
          </React.Fragment>
        }
      >
        <Stack space={2} marginLeft={3}>
          {data.map((dat, i) => (
            <JSONExplorerDisplay
              data={dat}
              key={i}
              prefix={String(i)}
              currentPath={addToPath(currentPath, String(i))}
              highlightedPaths={highlightedPaths}
            />
          ))}
        </Stack>
      </Collapsible>
    );
  }

  // Objects
  if (isObject(data)) {
    return (
      <Collapsible
        title={
          <React.Fragment>
            {prefixDisplay}
            <span style={{ color: COLORS.LABEL }}>
              {`{...}`} {Object.keys(data).length} properties
            </span>
          </React.Fragment>
        }
      >
        <Stack space={2} marginLeft={3}>
          {Object.entries(data).map(([key, dat]) => (
            <JSONExplorerDisplay
              data={dat}
              key={key}
              prefix={key}
              currentPath={addToPath(currentPath, key)}
              highlightedPaths={highlightedPaths}
            />
          ))}
        </Stack>
      </Collapsible>
    );
  }

  // Primitive leafs
  return (
    <div style={{ backgroundColor: errorMessage ? "pink" : "inherit" }}>
      {prefixDisplay}
      <span style={{ color: COLORS.VALUE }}>
        {formatPrimitiveData(data)}
      </span>{" "}
      {errorMessage && `[${errorMessage}]`}
    </div>
  );
};

const formatPrimitiveData = (data: unknown) =>
  typeof data === "string" ? `\"${data}\"` : String(data);

const isObject = (data: unknown): data is Record<string, unknown> =>
  typeof data === "object" && data !== null;

const addToPath = (existingPath: string, newSegment: string) =>
  existingPath ? `${existingPath}.${newSegment}` : newSegment;

const Collapsible = ({
  title,
  children,
}: React.PropsWithChildren<{ title: JSX.Element }>) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div>
      <div onClick={() => setIsExpanded((v) => !v)}>{title}</div>
      <div style={{ height: isExpanded ? "auto" : 0, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};

type Colors = { KEY: string; LABEL: string; VALUE: string };
const DARK_COLORS = {
  KEY: "#5998fc",
  LABEL: "#d05afc",
  VALUE: "#dbb931",
} satisfies Colors;

const LIGHT_COLORS = {
  KEY: "#1e61cd",
  LABEL: "#9d1fcd",
  VALUE: "#967e1c",
} satisfies Colors;

const useColors = (): Colors => {
  const prefersDark = usePrefersDark();
  return prefersDark ? DARK_COLORS : LIGHT_COLORS;
};
