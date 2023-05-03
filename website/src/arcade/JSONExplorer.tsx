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
  hasParentError?: boolean;
};

export function JSONExplorer(props: JSONExplorerDisplayProps) {
  return (
    <div className="absolute inset-0 overflow-auto px-4 pb-4 font-[Menlo,monospace] text-sm">
      <JSONExplorerDisplay {...props} />
    </div>
  );
}

function JSONExplorerDisplay({
  data,
  prefix,
  highlightedPaths,
  currentPath,
  hasParentError,
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
        hasParentError={hasParentError}
        errorMessage={errorMessage}
        id={`json-item-${currentPath}`}
      >
        <Stack space="2">
          {data.map((dat, i) => (
            <JSONExplorerDisplay
              data={dat}
              key={i}
              prefix={String(i)}
              currentPath={addToPath(currentPath, String(i))}
              highlightedPaths={highlightedPaths}
              hasParentError={!!errorMessage || hasParentError}
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
        hasParentError={hasParentError}
        id={`json-item-${currentPath}`}
      >
        <Stack space="1">
          {Object.entries(data).map(([key, dat]) => (
            <JSONExplorerDisplay
              data={dat}
              key={key}
              prefix={key}
              currentPath={addToPath(currentPath, key)}
              highlightedPaths={highlightedPaths}
              hasParentError={!!errorMessage || hasParentError}
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
      hasParentError={hasParentError}
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
  hasParentError,
  id,
  children,
}: React.PropsWithChildren<{
  title: JSX.Element;
  depth: number;
  errorMessage?: string;
  hasParentError?: boolean;
  id?: string;
}>) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <Stack
      space="2"
      className={clsx("rounded py-0.5", !!errorMessage && ERROR_CLASS)}
      id={id}
    >
      <LineItem
        depth={depth}
        onClick={() => setIsExpanded((v) => !v)}
        pointer
        hasParentError={!!errorMessage || hasParentError}
      >
        <Stack space="1">
          {errorMessage && <ErrorMessageText>{errorMessage}</ErrorMessageText>}
          <div>{title}</div>
        </Stack>
      </LineItem>
      <div style={{ height: isExpanded ? "auto" : 0, overflow: "hidden" }}>
        {children}
      </div>
    </Stack>
  );
}

function Key({ children }: React.PropsWithChildren) {
  return <span className="text-blue-700">{children}</span>;
}

function Label({ children }: React.PropsWithChildren) {
  return <span className="text-fuchsia-700">{children}</span>;
}

function Value({ children }: React.PropsWithChildren) {
  return <span className="text-yellow-800">{children}</span>;
}

function Stack({
  children,
  space = "0",
  className,
  ...rest
}: React.PropsWithChildren<
  React.HTMLProps<HTMLDivElement> & { space?: "0" | "1" | "2" }
>) {
  return (
    <div
      className={clsx(
        "grid",
        space === "1" && "gap-1",
        space === "2" && "gap-2",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function LineItem({
  children,
  hasError,
  hasParentError,
  depth = 0,
  pointer,
  ...rest
}: React.PropsWithChildren<
  React.HTMLProps<HTMLDivElement> & {
    hasError?: boolean;
    depth?: number;
    pointer?: boolean;
    hasParentError?: boolean;
  }
>) {
  return (
    <div
      style={{ paddingLeft: depth * DEPTH_SC }}
      className={clsx(
        "rounded py-0.5",
        !hasError && (!hasParentError || pointer) && "hover:bg-gray-50",
        hasParentError && pointer && "hover:bg-opacity-50",
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
  return <div className="text-sm text-gray-800">{children}</div>;
}

const DEPTH_SC = 12;
const ERROR_CLASS = "bg-red-100";
