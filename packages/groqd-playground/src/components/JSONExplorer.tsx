import * as React from "react";
import { Box, Button, Stack } from "@sanity/ui";
import {
  Root,
  Label,
  Key,
  Value,
  LineItem,
  ErrorMessageText,
} from "./JSONExplorer.styled";
import { CopyIcon } from "@sanity/icons";
import { useCopyDataAndNotify } from "../hooks/copyDataToClipboard";

type JSONExplorerDisplayProps = {
  data: unknown;
  prefix?: string;
  highlightedPaths?: Map<string, string>;
  currentPath?: string;
};

export const JSONExplorer = (props: JSONExplorerDisplayProps) => {
  const copyUrl = useCopyDataAndNotify("Copied JSON to clipboard!");
  const handleCopy = () => {
    try {
      copyUrl(JSON.stringify(props.data, null, 2));
    } catch {}
  };

  return (
    <Root flex={1}>
      <Box
        padding={3}
        style={{ position: "absolute", inset: 0 }}
        overflow="auto"
      >
        <JSONExplorerDisplay {...props} />
      </Box>
      <Box style={{ position: "absolute", bottom: 0, right: 0 }} padding={3}>
        <Button
          aria-label="Copy to clipboard"
          type="button"
          mode="ghost"
          icon={CopyIcon}
          text="Copy to clipboard"
          onClick={handleCopy}
        />
      </Box>
    </Root>
  );
};

const JSONExplorerDisplay = ({
  data,
  prefix,
  highlightedPaths,
  currentPath = "",
}: JSONExplorerDisplayProps) => {
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
      >
        <Stack space={2}>
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
      >
        <Stack space={2}>
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
      paddingY={1}
      depth={depth}
      hasError={!!errorMessage}
      id={`item-${currentPath}`}
    >
      <Stack space={1}>
        {errorMessage && <ErrorMessageText>{errorMessage}</ErrorMessageText>}
        <div>
          {prefixDisplay}
          <Value>{formatPrimitiveData(data)}</Value>{" "}
        </div>
      </Stack>
    </LineItem>
  );
};

const formatPrimitiveData = (data: unknown) =>
  typeof data === "string" ? `\"${data}\"` : String(data);

const isObject = (data: unknown): data is Record<string, unknown> =>
  typeof data === "object" && data !== null && !Array.isArray(data);

const addToPath = (existingPath: string, newSegment: string) =>
  existingPath ? `${existingPath}.${newSegment}` : newSegment;

const Collapsible = ({
  title,
  depth,
  children,
}: React.PropsWithChildren<{ title: JSX.Element; depth: number }>) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <Stack space={2}>
      <LineItem
        paddingY={1}
        depth={depth}
        onClick={() => setIsExpanded((v) => !v)}
        pointer
      >
        {title}
      </LineItem>
      <div style={{ height: isExpanded ? "auto" : 0, overflow: "hidden" }}>
        {children}
      </div>
    </Stack>
  );
};
