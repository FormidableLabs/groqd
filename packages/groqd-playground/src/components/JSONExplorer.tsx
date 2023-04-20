import * as React from "react";

type JSONExplorerProps = {
  data: unknown;
  prefix?: string;
  highlightedPaths?: Map<string, string>;
  currentPath?: string;
};

export const JSONExplorer = ({
  data,
  prefix,
  highlightedPaths,
  currentPath = "",
}: JSONExplorerProps) => {
  const prefixDisplay = prefix !== undefined ? `${prefix}:  ` : "";
  const errorMessage = highlightedPaths && highlightedPaths.get(currentPath);

  // Arrays
  if (Array.isArray(data)) {
    return (
      <div>
        <div>
          {prefixDisplay}[...] {data.length} items
        </div>
        <div style={{ marginLeft: 12 }}>
          {data.map((dat, i) => (
            <JSONExplorer
              data={dat}
              key={i}
              prefix={String(i)}
              currentPath={addToPath(currentPath, String(i))}
              highlightedPaths={highlightedPaths}
            />
          ))}
        </div>
      </div>
    );
  }

  // Objects
  if (isObject(data)) {
    return (
      <div>
        <div>
          {prefixDisplay}
          {`{...}`}
          {Object.keys(data).length} properties
        </div>
        <div style={{ marginLeft: 12 }}>
          {Object.entries(data).map(([key, dat]) => (
            <JSONExplorer
              data={dat}
              key={key}
              prefix={key}
              currentPath={addToPath(currentPath, key)}
              highlightedPaths={highlightedPaths}
            />
          ))}
        </div>
      </div>
    );
  }

  // Primitive leafs
  return (
    <div style={{ backgroundColor: errorMessage ? "pink" : "inherit" }}>
      {prefixDisplay}
      {formatPrimitiveData(data)} [{errorMessage}]
    </div>
  );
};

const formatPrimitiveData = (data: unknown) =>
  typeof data === "string" ? `\"${data}\"` : String(data);

const isObject = (data: unknown): data is Record<string, unknown> =>
  typeof data === "object" && data !== null;

const addToPath = (existingPath: string, newSegment: string) =>
  existingPath ? `${existingPath}.${newSegment}` : newSegment;
