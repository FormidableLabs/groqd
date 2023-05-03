import * as React from "react";
import {
  addToPath,
  formatPrimitiveData,
  isObject,
} from "../../../shared/util/jsonExplorerUtils";
import clsx from "clsx";

type JSONExplorerDisplayProps = {
  data: unknown;
  prefix?: string;
  highlightedPaths?: Map<string, string>;
  currentPath?: string;
};

export function JSONExplorer(props: JSONExplorerDisplayProps) {
  return (
    <div className="absolute inset-0 overflow-auto px-5 pb-5">
      <JSONExplorerDisplay {...props} />
    </div>
  );
}

function JSONExplorerDisplay({
  data,
  prefix,
  highlightedPaths,
  currentPath,
}: JSONExplorerDisplayProps) {
  const prefixDisplay = prefix !== undefined ? <Key>{prefix}: </Key> : null;
  const errorMessage = highlightedPaths && highlightedPaths.get(currentPath);
  const depth = currentPath === "" ? 0 : currentPath?.split(".").length || 0;

  // Arrays
  if (Array.isArray(data)) {
    return (
      <Collapsible
        depth={depth}
        title={
          <React.Fragment>
            {prefixDisplay}
            <Label>[...] {data.length} items</Label>
          </React.Fragment>
        }
        errorMessage={errorMessage}
        id={`json-item-${currentPath}`}
      >
        <Stack>
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
        depth={depth}
        title={
          <React.Fragment>
            {prefixDisplay}
            <Label>
              {`{...}`} {Object.keys(data).length} properties
            </Label>
          </React.Fragment>
        }
        errorMessage={errorMessage}
        id={`json-item-${currentPath}`}
      >
        <Stack>
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
    <LineItem
      depth={depth}
      hasError={!!errorMessage}
      id={`json-item-${currentPath}`}
    >
      <Stack>
        {errorMessage && <ErrorMessageText>{errorMessage}</ErrorMessageText>}
        <div>
          {prefixDisplay}
          <Value>{formatPrimitiveData(data)}</Value>{" "}
        </div>
      </Stack>
    </LineItem>
  );
}

function Collapsible({
  title,
  depth,
  errorMessage,
  id,
  children,
}: React.PropsWithChildren<{
  title: JSX.Element;
  depth: number;
  errorMessage?: string;
  id?: string;
}>) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // TODO: work to do here
  return (
    <div>
      <LineItem depth={depth} onClick={() => setIsExpanded((v) => !v)} pointer>
        {title}
      </LineItem>
      <div style={{ height: isExpanded ? "auto" : 0, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Key({ children }: React.PropsWithChildren) {
  return <span>{children}</span>;
}

function Label({ children }: React.PropsWithChildren) {
  return <span>{children}</span>;
}

function Stack({
  children,
  space = "0",
}: React.PropsWithChildren<{ space?: "0" | "1" | "2" }>) {
  return (
    <div
      className={clsx(
        "grid gap-2",
        space === "1" && "gap-2",
        space === "2" && "gap-3"
      )}
    >
      {children}
    </div>
  );
}

function LineItem({
  children,
  hasError,
  depth = 0,
  pointer,
  ...rest
}: React.PropsWithChildren<
  React.HTMLProps<HTMLDivElement> & {
    hasError?: boolean;
    depth?: number;
    pointer?: boolean;
  }
>) {
  return (
    <div
      style={{ paddingLeft: depth * DEPTH_SC }}
      className={clsx(
        "rounded",
        "hover:bg-gray-50",
        hasError && ERROR_CLASS,
        pointer && "cursor-pointer"
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function ErrorMessageText({ children }: React.PropsWithChildren) {
  return <div>{children}</div>;
}

function Value({ children }: React.PropsWithChildren) {
  return <span>{children}</span>;
}

const DEPTH_SC = 12;
const ERROR_CLASS = "bg-red-100";
